import './transcript-text.scss';
import Util from './../util';
import InteractiveTranscript from './transcript/interactive-transcript';
import Plaintext from './transcript/plaintext';
import Toolbar from './toolbar/toolbar';
import Dictionary from './../services/dictionary';
import { WebVTTParser } from 'webvtt-parser';
import { stripHtml } from 'string-strip-html';

/** Class for transcript */
export default class TranscriptText {
  /**
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      previousState: {},
    }, params);

    this.callbacks = Util.extend({
      onPositionChanged: () => {},
      resize: () => {}
    }, callbacks);

    // Transcript visible or invisible
    this.isVisible = this.params.previousState.isVisible ?? true;

    // Transcript mode interactive / plain text
    this.isInteractive = this.params.previousState.isInteractive ?? true;

    // Autoscroll on/off
    this.isAutoScrollActive = this.params.previousState.isAutoScrollActive ??
      true;

    // Autoscroll on/off
    this.isTimestampActive = this.params.previousState.isTimestampActive ??
      false;

    // Linebreaks on/off
    this.isLineBreakActive = this.params.previousState.isLineBreakActive ??
      false;

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-transcript-text-container');

    const buttonParams = [];
    this.params.buttons.forEach((button) => {
      if (button === 'visibility') {
        // Button: visibility
        buttonParams.push({
          id: 'visibility',
          type: 'pulse',
          pulseStates: [
            { id: 'visible', label: Dictionary.get('a11y.buttonVisible') },
            { id: 'invisible', label: Dictionary.get('a11y.buttonInvisible')},
          ],
          pulseIndex: (this.isVisible) ? 0 : 1,
          onClick: () => {
            this.handleVisibilityChanged();
          }
        });
      }
      else if (button === 'plaintext') {
        // Button: plaintext/interactive transcript
        buttonParams.push({
          id: 'plaintext',
          type: 'pulse',
          pulseStates: [
            {
              id: 'interactive',
              label: Dictionary.get('a11y.buttonInteractive')
            },
            {
              id: 'not-interactive',
              label: Dictionary.get('a11y.buttonPlaintext')
            }
          ],
          a11y: {
            disabled: Dictionary.get('a11y.buttonModeDisabled')
          },
          pulseIndex: (this.isInteractive) ? 0 : 1,
          onClick: () => {
            this.handleTranscriptModeChanged();
          }
        });
      }
      else if (button === 'autoscroll') {
        // Button: autoscroll
        buttonParams.push({
          id: 'autoscroll',
          type: 'toggle',
          active: this.isAutoScrollActive,
          a11y: {
            active: Dictionary.get('a11y.buttonAutoscrollActive'),
            inactive: Dictionary.get('a11y.buttonAutoscrollInactive'),
            disabled: Dictionary.get('a11y.buttonAutoscrollDisabled')
          },
          onClick: (event, params = {}) => {
            this.handleAutoScrollChanged(params.active);
          }
        });
      }
      else if (button === 'time') {
        // Button: time
        buttonParams.push({
          id: 'time',
          type: 'toggle',
          active: this.isTimestampActive,
          a11y: {
            active: Dictionary.get('a11y.buttonTimeActive'),
            inactive: Dictionary.get('a11y.buttonTimeInactive'),
            disabled: Dictionary.get('a11y.buttonTimeDisabled')
          },
          onClick: (event, params = {}) => {
            this.handleTimestampChanged(params.active);
          }
        });
      }
      else if (button === 'linebreak') {
        // Button: line break
        buttonParams.push({
          id: 'linebreak',
          type: 'toggle',
          active: this.isLineBreakActive,
          a11y: {
            active: Dictionary.get('a11y.buttonLineBreakActive'),
            inactive: Dictionary.get('a11y.buttonLineBreakInactive'),
            disabled: Dictionary.get('a11y.buttonLineBreakDisabled')
          },
          onClick: (event, params = {}) => {
            this.handleLineBreakChanged(params.active);
          }
        });
      }
    });

    // Toolbar
    this.toolbar = new Toolbar(
      {
        buttons: buttonParams,
        hidden: this.params.toolbarHidden,
        searchbox: this.params.searchbox
      },
      {
        onSearchChanged: (text) => {
          this.snippetsContainer.mark(text);
          this.plaintextContainer.mark(text);
        }
      }
    );
    this.dom.appendChild(this.toolbar.getDOM());

    this.transcriptContainer = document.createElement('div');
    this.transcriptContainer.classList.add(
      'h5p-transcript-transcript-container'
    );
    this.dom.appendChild(this.transcriptContainer);

    // Container for interactive transcript
    this.snippetsContainer = new InteractiveTranscript(
      {
        maxLines: this.params.maxLines,
        scrollSnippetsIntoView: this.isAutoScrollActive,
        showTimestamp: this.isTimestampActive,
        showLineBreaks: this.isLineBreakActive
      },
      {
        onPositionChanged: (params) => {
          this.callbacks.onPositionChanged(params);
        }
      }
    );
    if (!this.isInteractive) {
      this.snippetsContainer.hide();
    }
    this.transcriptContainer.appendChild(this.snippetsContainer.getDOM());

    // Container for plaintext transcript
    this.plaintextContainer = new Plaintext({
      maxLines: this.params.maxLines,
      showLineBreaks: this.isLineBreakActive
    });
    if (this.isInteractive) {
      this.plaintextContainer.hide();
    }
    this.transcriptContainer.appendChild(this.plaintextContainer.getDOM());

    // Toggle visibility
    if (!this.isVisible) {
      this.isVisible = true; // Will force click, so negate state
      this.handleVisibilityChanged();
    }

    if (this.params.maxLines) {
      // Determine lineHeight once container is in DOM (custom CSS possible)
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].intersectionRatio === 1) {
          this.handleTranscriptVisible(entries[0].target);
        }
      }, {
        root: document.documentElement,
        threshold: [1]
      });
      this.observer.observe(this.snippetsContainer.getDOM());
      this.observer.observe(this.plaintextContainer.getDOM());
    }
    else {
      this.toolbar.hideButton('autoscroll');
    }
  }

  /**
   * Get DOM.
   *
   * @returns {HTMLElement} Component's dom.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Initialize.
   */
  initialize() {
    const errorMessages = [];
    if (!this.params.hasInstance) {
      errorMessages.push(Dictionary.get('l10n.noMedium'));
    }
    if (!this.params.transcriptFilePath) {
      errorMessages.push(Dictionary.get('l10n.noTranscript'));
    }

    if (errorMessages.length) {
      this.snippetsContainer.setErrorMessage(
        errorMessages.join('<br />')
      );
      this.plaintextContainer.setErrorMessage(
        errorMessages.join('<br />')
      );
      this.callbacks.resize();
      return;
    }

    this.parseWebVTTFile(this.params.transcriptFilePath);
  }

  /**
   * Highlight a snippet (while unhighlighting all others).
   *
   * @param {object} [params={}] Parameters.
   * @param {number} [params.id] Id of snippet. Preferred.
   * @param {number} [params.time] Time that snippet should be displayed at.
   */
  highlightSnippet(params = {}) {
    this.snippetsContainer.highlightSnippet(params);
  }

  /**
   * Parse WebVTT file.
   *
   * @param {string} path WebVTT file path.
   */
  parseWebVTTFile(path) {
    fetch(path)
      .then((response) => response.text())
      .then((text) => {
        const parser = new WebVTTParser();
        this.handleWebVTTLoaded(parser.parse(text || '', 'metadata'));
      });
  }

  /**
   * Handle transcript visible.
   *
   * @param {HTMLElement} target Target.
   */
  handleTranscriptVisible(target) {
    this.observer.unobserve(this.snippetsContainer.getDOM());
    this.observer.unobserve(this.plaintextContainer.getDOM());

    const containerStyle = window.getComputedStyle(target);
    const lineHeight = parseFloat(
      containerStyle.getPropertyValue('line-height')
    );
    const fontSize = parseFloat(
      containerStyle.getPropertyValue('font-size')
    );

    this.snippetsContainer.setTelemetry({
      fontSize: fontSize, lineHeight: lineHeight
    });
    this.plaintextContainer.setTelemetry({
      fontSize: fontSize, lineHeight: lineHeight
    });

    this.callbacks.resize();
  }

  /**
   * Handle setting for autoscroll changed.
   *
   * @param {boolean} state If true, activate autoscroll.
   */
  handleAutoScrollChanged(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.isAutoScrollActive = state;
    this.snippetsContainer.setAutoScroll(state);
  }

  handleLineBreakChanged(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.isLineBreakActive = state;
    this.snippetsContainer.setLineBreaks(state);
    this.plaintextContainer.setLineBreaks(state);
  }

  /**
   * Handle setting for timestamp changed.
   *
   * @param {boolean} state If true, activate timestamp.
   */
  handleTimestampChanged(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.isTimestampActive = state;
    this.snippetsContainer.setTimestamp(state);
  }

  /**
   * Handle setting for transcript mode changed.
   */
  handleTranscriptModeChanged() {
    this.isInteractive = !this.isInteractive;

    if (this.isInteractive) {
      if (this.isVisible) {
        this.snippetsContainer.show();
        this.toolbar.enableButton('autoscroll');
        this.toolbar.enableButton('time');
      }
      this.plaintextContainer.hide();
    }
    else {
      this.snippetsContainer.hide();
      this.toolbar.disableButton('autoscroll');
      this.toolbar.disableButton('time');
      if (this.isVisible) {
        this.plaintextContainer.show();
      }
    }
  }

  /**
   * Handle setting for transcript mode changed.
   */
  handleVisibilityChanged() {
    this.isVisible = !this.isVisible;

    if (this.isVisible) {
      this.toolbar.enableButton('plaintext');
      this.toolbar.enableButton('linebreak');
      this.toolbar.enableSearchbox();

      if (this.isInteractive) {
        this.snippetsContainer.show();
        this.plaintextContainer.hide();
        this.toolbar.enableButton('autoscroll');
        this.toolbar.enableButton('time');
      }
      else {
        this.snippetsContainer.hide();
        this.plaintextContainer.show();
      }
    }
    else {
      this.toolbar.disableButton('autoscroll');
      this.toolbar.disableButton('plaintext');
      this.toolbar.disableButton('linebreak');
      this.toolbar.disableButton('time');
      this.toolbar.disableSearchbox();

      this.snippetsContainer.hide();
      this.plaintextContainer.hide();
    }

    this.callbacks.resize();
  }

  /**
   * Callback for WebVTTFile loaded.
   *
   * @param {object} webvtts WebVTT object.
   */
  handleWebVTTLoaded(webvtts) {
    webvtts.errors?.forEach((error) => {
      let location = [`line ${error.line}`];
      if (error.col) {
        location.push(`column ${error.col}`);
      }
      location = `(${ location.join(', ') })`; // array becomes string

      console.warn(
        `H5P.Transcript. Error in WebVTT file: ${error.message} ${location}`
      );
    });

    // Display error message
    if (!webvtts?.cues.length) {
      this.snippetsContainer.classList.add('h5p-transcript-message');
      this.snippetsContainer.innerHTML = Dictionary.get('l10n.troubleWebVTT');
      this.callbacks.resize();
      return;
    }

    webvtts.cues = webvtts.cues.map((cue) => {
      // Purify strings
      cue.text = stripHtml(cue.text, { ignoreTags: ['b', 'i', 'v'] }).result;

      // Replace line breaks
      cue.text = cue.text.replace(/(?:\r\n|\r|\n)/g, ' ');

      return cue;
    });

    // Build interactive transcript text.
    let snippets = JSON.parse(JSON.stringify(webvtts.cues));
    snippets = snippets.map((cue) => {
      // Style WebVTT voice tags, why is capturing group not working?
      let voice = cue.text.match(/<v(?:\..+?)* (.+?)>/g);
      if (voice) {
        const voiceTag = voice[0];
        const speaker = voiceTag.substring(
          voiceTag.indexOf(' ') + 1,
          voiceTag.length - 1
        );
        const text = cue.text.substring(voiceTag.length);

        cue.text =
          `<span class="h5p-transcript-snippet-speaker">${speaker}</span>\
          <span class="h5p-transcript-snippet-text">${text}</span>`;
      }

      return cue;
    });
    this.snippetsContainer.setSnippets(snippets);

    // Build transcript plain text.
    let plaintext = JSON.parse(JSON.stringify(webvtts.cues));
    plaintext = plaintext.map((cue) => {
      // Style WebVTT voice tags, why is capturing group not working?
      cue.text = stripHtml(cue.text, { ignoreTags: ['v'] }).result;

      let voice = cue.text.match(/<v(?:\..+?)* (.+?)>/g);
      if (voice) {
        const voiceTag = voice[0];
        const speaker = voiceTag.substring(
          voiceTag.indexOf(' ') + 1,
          voiceTag.length - 1
        );
        cue.text = cue.text.replace(
          voiceTag,
          `${speaker}: `
        );
      }

      return cue.text;
    });

    this.plaintextContainer.setText({
      snippets: plaintext
    });

    this.callbacks.resize();
  }

  /**
   * Get current state.
   *
   * @returns {object} Current state.
   */
  getCurrentState() {
    return {
      isVisible: this.isVisible,
      isAutoScrollActive: this.isAutoScrollActive,
      isInteractive: this.isInteractive,
      isTimestampActive: this.isTimestampActive,
      isLineBreakActive: this.isLineBreakActive
    };
  }

  /**
   * Show transcripts.
   */
  show() {
    // forceButton clicks the button
    this.isVisible = false;
    this.toolbar.forceButton('visibility', 0);
  }

  /**
   * Hide transcripts.
   */
  hide() {
    // forceButton clicks the button
    this.isVisible = true;
    this.toolbar.forceButton('visibility', 1);
  }

  /**
   * Show toolbar.
   */
  showToolbar() {
    this.toolbar.show();
  }

  /**
   * Show toolbar.
   */
  hideToolbar() {
    this.toolbar.hide();
  }

  /**
   * Show search box.
   */
  showSearchbox() {
    this.toolbar.showSearchbox();
  }

  /**
   * Hide search box.
   */
  hideSearchbox() {
    this.toolbar.hideSearchbox();
  }

  /**
   * Set autoscroll state.
   *
   * @param {boolean} state True: active. False: inactive.
   */
  setAutoScrollActive(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    if (state) {
      this.isAutoScrollActive = false;
      this.toolbar.forceButton('autoscroll', true);
    }
    else {
      this.isAutoScrollActive = true;
      this.toolbar.forceButton('autoscroll', false);
    }
  }

  /**
   * Set timestamp state.
   *
   * @param {boolean} state True: active. False: inactive.
   */
  setTimestampActive(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    if (state) {
      this.isTimestampActive = false;
      this.toolbar.forceButton('time', true);
    }
    else {
      this.isTimestampActive = true;
      this.toolbar.forceButton('time', false);
    }
  }

  /**
   * Set line breaks state.
   *
   * @param {boolean} state True: active. False: inactive.
   */
  setLineBreaksActive(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    if (state) {
      this.isLineBreakActive = false;
      this.toolbar.forceButton('linebreak', true);
    }
    else {
      this.isLineBreakActive = true;
      this.toolbar.forceButton('linebreak', false);
    }
  }

  /**
   * Set transcript state.
   *
   * @param {number} state 0 = interactive, 1 = plaintext.
   */
  setInteractive(state) {
    if (typeof state !== 'number') {
      return;
    }

    // forceButton clicks the button
    if (state === TranscriptText.MODE_INTERACTIVE_TRANSCRIPT) {
      this.isInteractive = false;
      this.toolbar.forceButton('plaintext', 0);
    }
    else if (state === TranscriptText.MODE_PLAINTEXT) {
      this.isInteractive = true;
      this.toolbar.forceButton('plaintext', 1);
    }
  }

  /**
   *
   * @param {string} id Button's id.
   * @param {boolean} state If true, show. If false, hide.
   */
  setButtonVisibility(id, state) {
    if (typeof id !== 'string' || typeof state !== 'boolean') {
      return;
    }

    if (state) {
      this.toolbar.showButton(id);
    }
    else {
      this.toolbar.hideButton(id);
    }
  }

  /**
   * Reset.
   */
  reset() {
    this.show();
    this.setAutoScrollActive(true);
    this.setInteractive(TranscriptText.MODE_INTERACTIVE_TRANSCRIPT);
    this.setTimestampActive(false);

    this.snippetsContainer.reset();
    this.plaintextContainer.reset();
  }
}

/** @constant {number} Interactive transcript mode */
TranscriptText.MODE_INTERACTIVE_TRANSCRIPT = 0;

/** @constant {number} Plaintext mode */
TranscriptText.MODE_PLAINTEXT = 1;
