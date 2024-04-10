import '@components/transcript-text.scss';
import Util from '@services/util.js';
import InteractiveTranscript from '@components/transcript/interactive-transcript.js';
import ChapterMarks from '@components/chapter-marks/chapter-marks.js';
import Plaintext from '@components/transcript/plaintext.js';
import Toolbar from '@components/toolbar/toolbar.js';
import Dictionary from '@services/dictionary.js';
import { WebVTTParser } from 'webvtt-parser';
import LanguageDetect from 'languagedetect';

/** Class for transcript */
export default class TranscriptText {
  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [callbacks] Callbacks.
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

    // Previously selected transcript
    this.selectedScriptId = this.params.previousState.selectedScriptId ?? 0;

    // Available transcripts
    this.transcripts = {};

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
            this.setLineBreak(params.active);
          }
        });
      }
    });

    if (this.params.chapterMarks) {
      buttonParams.push({
        id: 'chaptermarks',
        type: 'pulse',
        pulseStates: [
          {
            id: 'chaptermarksopen',
            label: Dictionary.get('a11y.buttonChapterMarksOpen')
          },
          {
            id: 'chaptermarksclose',
            label: Dictionary.get('a11y.buttonChapterMarksClose')
          }
        ],
        a11y: {
          disabled: Dictionary.get('a11y.buttonChapterMarksDisabled')
        },
        onClick: () => {
          this.toggleChapterMarks();
        }
      });
    }

    // Toolbar
    this.toolbar = new Toolbar(
      {
        buttons: buttonParams,
        hidden: this.params.toolbarHidden,
        selectbox: {
          options: this.params.transcriptFiles.map((file) => {
            return Util.stripHTML(Util.htmlDecode(file.label));
          }),
          selectedId: this.selectedScriptId
        },
        searchbox: this.params.searchbox,
      },
      {
        onSearchChanged: (text) => {
          this.highlightText(text);
        },
        onLanguageChanged: (index) => {
          this.switchToTranscript(index);
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

    if (this.params.chapterMarks) {
      this.chapterMarks = new ChapterMarks(
        {
          chapterMarks: this.params.chapterMarks
        },
        {
          onClosed: () => {
            this.toggleChapterMarks(false);
          },
          onChapterChanged: (time) => {
            this.callbacks.onPositionChanged(time);
          }
        }
      );
      this.dom.append(this.chapterMarks.getDOM());
    }
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} Component's dom.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Initialize.
   */
  async initialize() {
    const errorMessages = [];
    if (!this.params.hasInstance) {
      errorMessages.push(Dictionary.get('l10n.noMedium'));
    }
    if (!this.params.transcriptFiles.length) {
      errorMessages.push(Dictionary.get('l10n.noTranscript'));
    }

    if (errorMessages.length) {
      this.toolbar.disable();

      this.snippetsContainer.setErrorMessage(
        errorMessages.join('\n')
      );
      this.plaintextContainer.setErrorMessage(
        errorMessages.join('\n')
      );
      this.callbacks.resize();
      return;
    }

    await this.switchToTranscript(this.selectedScriptId);

    // Load remaining transcripts
    this.params.transcriptFiles.forEach(async (file, index) => {
      await this.prepareTranscript(file, index);
    });
  }

  /**
   * Prepare transcript.
   * @param {object} [data] Parameters from author.
   * @param {number} index Index of transcript.
   */
  async prepareTranscript(data = {}, index) {
    if (this.transcripts[index]) {
      return; // Already prepared
    }

    this.transcripts[index] =
      await this.parseWebVTTFile(data.transcriptFile.path, data.languageCode);

    this.transcripts[index]?.cues.errors?.forEach((error) => {
      let location = [`line ${error.line}`];
      if (error.col) {
        location.push(`column ${error.col}`);
      }
      location = `(${ location.join(', ') })`; // array becomes string

      console.warn(
        `H5P.Transcript. Error in WebVTT file: ${error.message} ${location}`
      );
    });

    let cues = this.transcripts[index].cues.cues; // Just for abbreviation

    // Sanitize cues
    cues = cues
      .map((cue) => {
        // Purify strings
        cue.text = Util.stripHTML(
          cue.text, {
            keepTags: [
              'b', 'i', 'u',
              { tag: 'v', keepAttributes: true}
            ]
          }
        );

        // Replace line breaks
        cue.text = cue.text.replace(/(?:\r\n|\r|\n)/g, ' ');

        return cue;
      });

    // Build interactive transcript text.
    this.transcripts[index].snippets = cues.map((cue) => {
      const result = {...cue};

      // Style WebVTT voice tags, why is capturing group not working?
      let voice = result.text.match(/<v(?:\..+?)* (.+?)>/g);
      if (voice) {
        const voiceTag = voice[0];
        const speaker = voiceTag.substring(
          voiceTag.indexOf(' ') + 1,
          voiceTag.length - 1
        );
        const text = Util.stripHTML(result.text, { keepTags: ['b', 'i', 'u'] });

        result.text =
          `<span class="h5p-transcript-snippet-speaker">${speaker}</span>\
          <span class="h5p-transcript-snippet-text">${text}</span>`;
      }

      return result;
    });

    // Build transcript plain text.
    this.transcripts[index].plaintext = cues.map((cue) => {
      const result = {...cue};

      // Style WebVTT voice tags, why is capturing group not working?
      result.text = Util.stripHTML(
        result.text, { keepTags: [{ tag: 'v', keepAttributes: true }] }
      );

      let voice = result.text.match(/<v(?:\..+?)* (.+?)>/g);
      if (voice) {
        const voiceTag = voice[0];
        const speaker = voiceTag.substring(
          voiceTag.indexOf(' ') + 1,
          voiceTag.length - 1
        );

        result.text = result.text.replace(
          voiceTag,
          `${speaker}: `
        );
      }

      return result.text;
    });
  }

  /**
   * Set language code.
   * @param {string} languageCode Language code as BCP-47.
   */
  setLanguageCode(languageCode) {
    if (languageCode === null) {
      this.transcriptContainer.removeAttribute('lang');
      return;
    }

    if (typeof languageCode !== 'string') {
      return;
    }

    this.transcriptContainer.setAttribute(
      'lang', Util.htmlDecode(languageCode)
    );
  }

  /**
   * Update time.
   * @param {number} time Time.
   */
  updateTime(time) {
    this.highlightSnippet({ time: time });
    this.chapterMarks?.updateTime(time);
  }

  /**
   * Highlight a snippet (while unhighlighting all others).
   * @param {object} [params] Parameters.
   * @param {number} [params.id] Id of snippet. Preferred.
   * @param {number} [params.time] Time that snippet should be displayed at.
   */
  highlightSnippet(params = {}) {
    this.snippetsContainer.highlightSnippet(params);
  }

  /**
   * Parse WebVTT file.
   * @param {string} path WebVTT file path.
   * @param {string} [languageCode] Language code.
   * @returns {object} Cues and language code.
   */
  async parseWebVTTFile(path, languageCode) {
    const response = await fetch(path);
    const webvttText = await response.text();

    // Try to extract language code from WebVTT file
    if (typeof languageCode !== 'string') {
      const languageCodeMatches = webvttText.match(/Language:\s*([a-z][a-z])/);
      languageCode = languageCodeMatches && languageCodeMatches[1] || null;
    }

    const parser = new WebVTTParser();
    const cues = parser.parse(webvttText || '', 'metadata');

    // Try to automatically determine language of transcript text for a11y
    if (typeof languageCode !== 'string') {
      const plainText = JSON.parse(JSON.stringify(cues.cues))
        .map((cue) => cue.text).join(' ');

      const languageDetect = new LanguageDetect();
      languageDetect.setLanguageType('iso2');

      const languageInfo = languageDetect.detect(plainText, 1)[0];
      languageCode = languageInfo ? languageInfo[0] : null;
    }

    return { cues: cues, languageCode: languageCode };
  }

  /**
   * Switch to transcript.
   * @param {number} index Index of transcript to switch to.
   */
  async switchToTranscript(index) {
    await this.prepareTranscript(this.params.transcriptFiles[index], index);

    // Display error message
    if (!this.transcripts[index]?.cues?.cues.length) {
      this.setLanguageCode(null);
      this.snippetsContainer.setErrorMessage(
        Dictionary.get('l10n.troubleWebVTT')
      );
      this.callbacks.resize();

      return;
    }

    this.selectedScriptId = index;

    this.setLanguageCode(
      this.transcripts[index].languageCode
    );

    this.snippetsContainer.setSnippets(
      this.transcripts[index].snippets
    );

    this.plaintextContainer.setText({
      snippets: this.transcripts[index].plaintext
    });

    this.applyViewChangesToTranscript();

    this.callbacks.resize();
  }

  /**
   * (Re)apply view changes.
   */
  applyViewChangesToTranscript() {
    this.snippetsContainer.setLineBreaks(this.isLineBreakActive);
    this.plaintextContainer.setLineBreaks(this.isLineBreakActive);

    this.snippetsContainer.mark(this.highlightedText);
    this.plaintextContainer.mark(this.highlightedText);
  }

  /**
   * Handle transcript visible.
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
   * Set line break state.
   * @param {boolean} state State.
   */
  setLineBreak(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.isLineBreakActive = state;
    this.applyViewChangesToTranscript();
  }

  /**
   * Highlight text.
   * @param {string} text to highlight.
   */
  highlightText(text) {
    if (typeof text !== 'string') {
      return;
    }

    this.highlightedText = text;
    this.applyViewChangesToTranscript();
  }

  /**
   * Handle setting for timestamp changed.
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

    this.applyViewChangesToTranscript();
  }

  /**
   * Handle setting for transcript mode changed.
   */
  handleVisibilityChanged() {
    this.isVisible = !this.isVisible;

    if (this.isVisible) {
      this.toolbar.enableButton('plaintext');
      this.toolbar.enableButton('linebreak');
      this.toolbar.enableButton('chaptermarks');
      this.toolbar.enableSelectField();
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
      this.toolbar.disableButton('chaptermarks');
      this.toolbar.disableSelectField();
      this.toolbar.disableSearchbox();

      this.snippetsContainer.hide();
      this.plaintextContainer.hide();
    }

    this.callbacks.resize();
  }

  /**
   * Get current state.
   * @returns {object} Current state.
   */
  getCurrentState() {
    return {
      isVisible: this.isVisible,
      isAutoScrollActive: this.isAutoScrollActive,
      isInteractive: this.isInteractive,
      isTimestampActive: this.isTimestampActive,
      isLineBreakActive: this.isLineBreakActive,
      selectedScriptId: this.selectedScriptId
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
   * Toggle chapter marks.
   * @param {boolean} state Sate to toggle to.
   */
  toggleChapterMarks(state) {
    if (typeof state !== 'boolean') {
      state = null;
    }

    this.isChapterMarksOpen = state ?? !this.isChapterMarksOpen;

    if (this.isChapterMarksOpen) {
      this.chapterMarks.show();
    }
    else {
      this.chapterMarks.hide();
      this.toolbar.forceButton('chaptermarks', 0, true);
    }

    this.callbacks.resize();
  }

  /**
   * Set autoscroll state.
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
   * Get chapter marks.
   * @returns {object[]} Chapter marks with time and label.
   */
  getChapterMarks() {
    return this.params.chapterMarks ?? [];
  }

  /**
   * Jump to chapter mark.
   * @param {number} id If of chapter mark to jump to.
   */
  jumpToChapterMark(id) {
    if (typeof id !== 'number' || !this.params.chapterMarks?.length) {
      return;
    }

    if (id < 0 || id > this.params?.chapterMarks.length - 1) {
      return;
    }

    this.callbacks.onPositionChanged(this.params.chapterMarks[id].time);
  }

  /**
   * Set transcription depending on index.
   * @param {number} index Id of transcription to set active.
   */
  setTranscriptionTo(index) {
    this.toolbar.setSelectboxTo(index);
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
