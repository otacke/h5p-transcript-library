import Util from './util';
import TimeTracker from './time-tracker';
import TranscriptText from './components/transcript-text';
import Dictionary from './services/dictionary';
import '../styles/h5p-transcript-library.scss';

export default class TranscriptLibrary extends H5P.EventDispatcher {
  /**
   * @class
   * @param {object} params Parameters passed by parent.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super();

    // Sanitize parameters
    this.params = Util.extend({
      transcriptFile: {},
      behaviour: {
        maxLines: 10,
        buttons: ['visibility', 'plaintext', 'linebreak', 'autoscroll', 'time'],
        searchbox: true
      },
      l10n: {
        noMedium: 'No medium was assigned to the transcript.',
        noTranscript: 'No transcript was provided.',
        troubleWebVTT: 'There seems to be something wrong with the WebVTT file. Please consult the browser\'s development console for more information.'
      },
      a11y: {
        buttonVisible: 'Hide transcript. Currently visible.',
        buttonInvisible: 'Show transcript. Currently not visible.',
        buttonAutoscrollActive: 'Turn off autoscroll. Currently active.',
        buttonAutoscrollInactive: 'Turn on autoscroll. Currently not active.',
        buttonAutoscrollDisabled: 'Autoscroll option disabled.',
        buttonInteractive: 'Switch to plaintext view',
        buttonPlaintext: 'Switch to interactive transcript view',
        buttonModeDisabled: 'Mode switching disabled.',
        buttonTimeActive: 'Hide start time. Currently shown.',
        buttonTimeInactive: 'Show start time. Currently not shown.',
        buttonTimeDisabled: 'Start time option disabled.',
        buttonLineBreakActive: 'Hide line breaks. Currently shown.',
        buttonLineBreakInactive: 'Show line breaks. Currently not shown.',
        buttonLineBreakDisabled: 'Line break option disabled.',
        interactiveTranscript: 'Interactive transcript',
        enterToHighlight: 'Enter a query to highlight relevant text.',
        searchboxDisabled: 'Search box disabled.'
      }
    }, params);

    if (params?.behaviour?.buttons) {
      this.params.behaviour.buttons = params.behaviour.buttons;
    }

    this.contentId = contentId;
    this.extras = extras;

    // Fill dictionary
    Dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    this.previousState = extras?.previousState || {};

    const defaultLanguage = extras?.metadata?.defaultLanguage || 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    if (params.instance) {
      // Track current time of instance
      this.tracker = new TimeTracker(
        { instance: params.instance },
        {
          onTimeUpdated: (time) => {
            this.transcriptText.highlightSnippet({ time: time });
          }
        }
      );
      this.tracker.start();
    }

    const transcriptFilePath = this.params.transcriptFile.path ?
      H5P.getPath(this.params.transcriptFile.path, this.contentId) :
      null;

    this.transcriptText = new TranscriptText(
      {
        hasInstance: this.params.instance,
        transcriptFilePath: transcriptFilePath,
        maxLines: this.params.behaviour.maxLines,
        ...(this.previousState.transcript &&
          { previousState: this.previousState.transcript }
        ),
        toolbarHidden: this.params.behaviour.toolbarHidden,
        buttons: this.params.behaviour.buttons,
        searchbox: this.params.behaviour.searchbox
      },
      {
        onPositionChanged: (time) => {
          this.handlePositionChanged(time);
        },
        resize: () => {
          this.trigger('resize');
        }
      }
    );

    this.transcriptText.initialize();
  }

  /**
   * Attach library to wrapper.
   *
   * @param {H5P.jQuery} $wrapper Content's container.
   */
  attach($wrapper) {
    this.dom = $wrapper.get(0);
    this.dom.classList.add('h5p-transcript-library');
    this.dom.appendChild(this.buildDOM());

    // Make sure DOM has been rendered with content
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        this.trigger('resize');
      });
    });
  }

  /**
   * Build DOM.
   *
   * @returns {HTMLElement} Content DOM.
   */
  buildDOM() {
    const content = document.createElement('div');
    content.classList.add('h5p-transcript-content');
    content.appendChild(this.transcriptText.getDOM());

    return content;
  }

  /**
   * Handle timer position changed.
   *
   * @param {number} time Time in seconds.
   */
  handlePositionChanged(time) {
    if (!this.params.instance || typeof time !== 'number') {
      return;
    }

    const machineName = this.params.instance.libraryInfo.machineName;
    if (machineName === 'H5P.Audio') {
      this.params.instance.audio.currentTime = time;
    }
    else if (machineName === 'H5P.InteractiveVideo') {
      this.params.instance.video.seek(time);
    }
    else if (machineName === 'H5P.Video') {
      this.params.instance.seek(time);
    }
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
    this.trigger('resize');
  }

  /**
   * Hide.
   */
  hide() {
    this.dom.classList.add('display-none');
    this.trigger('resize');
  }

  /**
   * Show toolbar.
   */
  showToolbar() {
    this.transcriptText.showToolbar();
    this.trigger('resize');
  }

  /**
   * Hide toolbar.
   */
  hideToolbar() {
    this.transcriptText.hideToolbar();
    this.trigger('resize');
  }

  /**
   * Show.
   */
  showSearchbox() {
    this.transcriptText.showSearchbox();
  }

  /**
   * Hide.
   */
  hideSearchbox() {
    this.transcriptText.hideSearchbox();
  }

  /**
   * Show transcripts.
   */
  showTranscripts() {
    this.transcriptText.show();
    this.trigger('resize');
  }

  /**
   * Hide transcripts.
   */
  hideTranscripts() {
    this.transcriptText.hide();
    this.trigger('resize');
  }

  /**
   * Set autoscroll active.
   *
   * @param {boolean} state If true, set active. If false, inactive.
   */
  setAutoScrollActive(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.transcriptText.setAutoScrollActive(state);
  }

  /**
   * Set autoscroll active/inactive.
   *
   * @param {boolean} state If true, set active. If false, inactive.
   */
  setTimestampActive(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.transcriptText.setTimestampActive(state);
  }

  /**
   * Set line breaks active/inactive.
   *
   * @param {boolean} state If true, set active. If false, inactive.
   */
  setLineBreaksActive(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.transcriptText.setLineBreaksActive(state);
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

    this.transcriptText.setInteractive(state);
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

    this.transcriptText.setButtonVisibility(id, state);
  }

  /**
   * Reset.
   */
  reset() {
    this.transcriptText.reset();
    this.trigger('resize');
  }

  /**
   * Get current state.
   *
   * @returns {object} Current state.
   */
  getCurrentState() {
    return {
      transcript: this.transcriptText.getCurrentState()
    };
  }
}
