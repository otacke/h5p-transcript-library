import './interactive-transcript.scss';
import TranscriptSnippet from './transcript-snippet.js';
import Dictionary from '@services/dictionary.js';
import Util from '@services/util.js';

/** Class for transcript */
export default class InteractiveTranscript {
  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);
    this.callbacks = Util.extend({
      onPositionChanged: () => {}
    }, callbacks);

    this.snippets = [];
    this.separators = [];
    this.scrollSnippetsIntoView = this.params.scrollSnippetsIntoView;
    this.showTimestamp = this.params.showTimestamp;
    this.showLineBreaks = this.params.showLineBreaks;
    this.selectedSnippetIndex = 0;

    // Container for plaintext transcript
    this.dom = document.createElement('ul');
    this.dom.classList.add('h5p-transcript-snippets-container');
    this.dom.setAttribute('tabindex', '0');
    this.dom.setAttribute('aria-expanded', 'false');
    this.dom.setAttribute('aria-label', Dictionary.get('a11y.interactiveTranscript'));

    // Implementing expandable a11y list
    this.dom.addEventListener('keydown', (event) => {
      const currentExpandedState = this.dom.getAttribute('aria-expanded');
      const focusSnippet = this.snippets[this.selectedSnippetIndex];

      if (event.code === 'Space' || event.code === 'Enter') {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (currentExpandedState === 'false') {
          this.dom.setAttribute('aria-expanded', 'true');
          this.handleSnippetSelected(0);
        }
        else {
          this.dom.setAttribute('aria-expanded', 'false');
          focusSnippet.setTabbable(false);
        }

        event.preventDefault();
      }
    });
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} Component's dom.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Set snippets.
   * @param {object} [cues] Snippets to set.
   */
  setSnippets(cues = []) {
    if (!cues.length) {
      return;
    }

    this.snippets = [];
    this.separators = [];
    this.dom.classList.remove('h5p-transcript-message');
    this.dom.innerHTML = '';

    cues.forEach((cue, index) => {
      const snippet = new TranscriptSnippet(
        {
          id: index,
          text: cue.text,
          startTime: cue.startTime,
          endTime: cue.endTime,
          showTimestamp: this.showTimestamp
        },
        {
          onClicked: (params) => {
            this.handleSnippetClicked(params);
          },
          onSelected: (offset) => {
            this.handleSnippetSelected(offset);
          }
        }
      );

      this.snippets.push(snippet);
      this.dom.appendChild(snippet.getDOM());

      if (index < cues.length - 1) {
        const separator = document.createElement('span');
        separator.classList.add('h5p-transcript-snippet-separator');
        if (this.showLineBreaks) {
          separator.classList.add(
            'h5p-transcript-snippet-separator-line-break'
          );
        }

        this.separators.push(separator);
        this.dom.appendChild(separator);
      }
    });

    // Determine offset of snippets text to container border
    window.requestAnimationFrame(() => {
      this.defaultSnippetOffset = this.snippets[0].getDOM().offsetTop -
        this.dom.offsetTop;
    });
  }

  /**
   * Set error message.
   * @param {string} message Error message.
   */
  setErrorMessage(message) {
    this.dom.classList.add('h5p-transcript-message');
    this.dom.innerText = message;
  }

  /**
   * Highlight a snippet (while unhighlighting all others).
   * @param {object} [params] Parameters.
   * @param {number} [params.id] Id of snippet. Preferred.
   * @param {number} [params.time] Time that snippet should be displayed at.
   */
  highlightSnippet(params = {}) {
    if (typeof params.id !== 'number') {
      if (typeof params.time !== 'number') {
        return;
      }

      params.id = this.snippets
        .findIndex((snippet) => snippet.isDisplayedAt(params.time));
    }

    if (params.id < 0) {
      return; // Could not find snippet index
    }

    this.snippets.forEach((snippet, index) => {
      snippet.setPassed(index < params.id );

      if (params.id === index) {
        snippet.highlight();

        if (this.params.maxLines && this.scrollSnippetsIntoView) {
          this.scrollIntoView(snippet);
        }
      }
      else {
        snippet.unhighlight();
      }
    });
  }

  /**
   * Mark text in snippets.
   * @param {string} text Text to mark.
   */
  mark(text) {
    this.snippets.forEach((snippet) => {
      snippet.mark(text);
    });
  }

  /**
   * Handle setting for autoscroll changed.
   * @param {boolean} state If true, activate autoscroll.
   */
  setAutoScroll(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.scrollSnippetsIntoView = state;
  }

  /**
   * Handle setting for line breaks changed.
   * @param {boolean} state If true, activate line breaks.
   */
  setLineBreaks(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.separators.forEach((separator) => {
      separator.classList.toggle(
        'h5p-transcript-snippet-separator-line-break',
        state
      );
    });
  }

  /**
   * Handle setting for autoscroll changed.
   * @param {boolean} state If true, activate autoscroll.
   */
  setTimestamp(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.showTimestamp = state;

    this.snippets.forEach((snippet) => {
      snippet.setTimestamp(state);
    });
  }

  /**
   * Set telemetry.
   * @param {object} [params] Parameters.
   * @param {number} params.lineHeight Line height.
   * @param {number} params.fontSize Line height.
   */
  setTelemetry(params = {}) {
    if (
      typeof params.lineHeight !== 'number' ||
      typeof params.fontSize !== 'number'
    ) {
      return;
    }
    this.fontSize = params.fontSize;
    this.lineHeight = params.lineHeight;

    const factor = this.lineHeight / this.fontSize;
    const maxHeight = `${this.params.maxLines * factor}em`;
    this.dom.style.maxHeight = maxHeight;
  }

  /**
   * Scroll snippet into view of container.
   * @param {TranscriptSnippet} snippet Snippet.
   */
  scrollIntoView(snippet) {
    const snippetPosition = snippet.getDOM().offsetTop -
      this.dom.offsetTop - this.defaultSnippetOffset;

    if (snippetPosition < this.dom.scrollTop) {
      this.dom.scrollTop = snippetPosition;
    }
    else if (snippetPosition + snippet.getDOM().offsetHeight >
      this.dom.scrollTop + this.dom.offsetHeight
    ) {
      const lineHeightCeil = Math.ceil(
        snippet.getDOM().offsetHeight / this.lineHeight
      ) * this.lineHeight;

      this.dom.scrollTop = snippetPosition + lineHeightCeil -
        this.dom.offsetHeight;
    }
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
  }

  /**
   * Hide.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Handle snippet was clicked.
   * @param {object} [params] Parameters.
   * @param {number} [params.id] Id of snippet.
   * @param {number} [params.time] Start time of snippet.
   */
  handleSnippetClicked(params = {}) {
    if (typeof params.id !== 'number' || !params.time) {
      return;
    }

    if (this.isAutoScrollActive) {
      this.highlightSnippet({ id: params.id });
    }

    this.callbacks.onPositionChanged(params.time);
  }

  /**
   * Handle snipped selected.
   * @param {number} offset Offset.
   */
  handleSnippetSelected(offset) {
    if (typeof offset !== 'number') {
      return;
    }

    if (
      this.selectedSnippetIndex + offset < 0 ||
      this.selectedSnippetIndex + offset > this.snippets.length - 1
    ) {
      return;
    }

    this.snippets[this.selectedSnippetIndex].setTabbable(false);

    this.selectedSnippetIndex = this.selectedSnippetIndex + offset;

    this.snippets[this.selectedSnippetIndex].setTabbable(true);
    this.snippets[this.selectedSnippetIndex].focus();
  }

  /**
   * Reset.
   */
  reset() {
    this.dom.scrollTop = 0;
  }
}
