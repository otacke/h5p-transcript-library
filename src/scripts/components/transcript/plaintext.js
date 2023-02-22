import './plaintext.scss';
import Util from '@services/util';
import Mark from 'mark.js';

export default class Plaintext {
  /**
   * Plain text container.
   *
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);
    this.callbacks = Util.extend({}, callbacks);

    this.snippets = [];
    this.showLinebreaks = this.params.showLineBreaks || false;

    // Container for plaintext transcript
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-transcript-plaintext-container');

    this.markInstance = new Mark(this.dom);
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
   * Set text. Make sure it's purified!
   *
   * @param {object} [params={}] Parameters.
   * @param {string[]} params.snippets Text snippets.
   */
  setText(params = {}) {
    if (!Array.isArray(params.snippets)) {
      return;
    }

    this.dom.classList.remove('h5p-transcript-message');
    this.snippets = params.snippets;

    this.setLineBreaks(this.showLinebreaks || false);
  }

  /**
   * Handle setting for line breaks changed.
   *
   * @param {boolean} state If true, activate line breaks.
   */
  setLineBreaks(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.dom.innerHTML = this.snippets.reduce((text, snippet, index) => {
      let displayText = state ?
        `<p class="h5p-transcript-plaintext-snippet">${snippet}</p>` :
        snippet;

      if (index < this.snippets.length - 1) {
        displayText = `${displayText} `;
      }

      return `${text}${displayText}`;
    }, '');
  }

  /**
   * Mark text.
   *
   * @param {string} text Text to mark.
   */
  mark(text) {
    if (typeof text !== 'string') {
      return;
    }

    this.markInstance.unmark();
    this.markInstance.mark(text);
  }

  /**
   * Set error message.
   *
   * @param {string} message Error message.
   */
  setErrorMessage(message) {
    this.dom.classList.add('h5p-transcript-message');
    this.dom.innerText = message;
  }

  /**
   * Set telemetry.
   *
   * @param {object} [params={}] Parameters.
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
   * Reset.
   */
  reset() {
    this.dom.scrollTop = 0;
  }
}
