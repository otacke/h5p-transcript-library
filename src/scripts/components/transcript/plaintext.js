import './plaintext.scss';
import Util from './../../util';
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
   * Set text.
   *
   * @param {string} text Text to set.
   */
  setText(text) {
    this.dom.classList.remove('h5p-transcript-message');
    this.dom.innerText = text;
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
