import './transcript-text.scss';
import Util from './../util';
import InteractiveTranscript from './transcript/interactive-transcript';
import Plaintext from './transcript/plaintext';
import Toolbar from './toolbar/toolbar';
import Dictionary from './../services/dictionary';
import { WebVTTParser } from 'webvtt-parser';

/** Class for transcript */
export default class TranscriptText {
  /**
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      previousState: {}
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

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-transcript-text-container');

    // Toolbar
    this.toolbar = new Toolbar({
      hidden: this.params.toolbarHidden
    });

    // Button: visibility
    this.toolbar.addButton({
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
    this.dom.appendChild(this.toolbar.getDOM());

    // Button: plaintext/interactive transcript
    this.toolbar.addButton({
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
    this.dom.appendChild(this.toolbar.getDOM());

    // Button: autoscroll
    this.toolbar.addButton({
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

    this.transcriptContainer = document.createElement('div');
    this.transcriptContainer.classList.add(
      'h5p-transcript-transcript-container'
    );
    this.dom.appendChild(this.transcriptContainer);

    // Container for interactive transcript
    this.snippetsContainer = new InteractiveTranscript(
      {
        maxLines: this.params.maxLines,
        scrollSnippetsIntoView: this.isAutoScrollActive
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
    this.plaintextContainer = new Plaintext({ maxLines: this.params.maxLines });
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

  /**
   * Handle setting for transcript mode changed.
   */
  handleTranscriptModeChanged() {
    this.isInteractive = !this.isInteractive;

    if (this.isInteractive) {
      if (this.isVisible) {
        this.snippetsContainer.show();
      }
      this.plaintextContainer.hide();
    }
    else {
      this.snippetsContainer.hide();
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
      this.toolbar.enableButton('autoscroll');
      this.toolbar.enableButton('plaintext');

      if (this.isInteractive) {
        this.snippetsContainer.show();
        this.plaintextContainer.hide();
      }
      else {
        this.snippetsContainer.hide();
        this.plaintextContainer.show();
      }
    }
    else {
      this.toolbar.disableButton('autoscroll');
      this.toolbar.disableButton('plaintext');

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

    // Build interactive transcript text.
    this.snippetsContainer.setSnippets(
      webvtts.cues
        .map((cue) => {
          cue.text = cue.text.replace(/(?:\r\n|\r|\n)/g, ' ');
          return cue;
        })
    );

    // Build transcript plain text.
    this.plaintextContainer.setText(
      webvtts.cues
        .map((cue) => cue.text.replace(/(?:\r\n|\r|\n)/g, ' '))
        .join(' ')
    );

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
      isInteractive: this.isInteractive
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
   * Reset.
   */
  reset() {
    this.show();
    this.setAutoScrollActive(true);
    this.setInteractive(TranscriptText.MODE_INTERACTIVE_TRANSCRIPT);

    this.snippetsContainer.reset();
    this.plaintextContainer.reset();
  }
}

/** @constant {number} Interactive transcript mode */
TranscriptText.MODE_INTERACTIVE_TRANSCRIPT = 0;

/** @constant {number} Plaintext mode */
TranscriptText.MODE_PLAINTEXT = 1;
