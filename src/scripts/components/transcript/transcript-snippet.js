import './transcript-snippet.scss';
import Util from './../../util';

/** Class for a text snippet */
export default class TranscriptSnippet {
  /**
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      text: '',
      showTimestamp: false
    }, params);

    this.callbacks = Util.extend({
      onClicked: () => {},
      onSelected: () => {},
    }, callbacks);

    this.dom = document.createElement('li');
    this.dom.classList.add('h5p-transcript-snippet');
    this.setTimestamp(this.params.showTimestamp);

    this.dom.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleClick();
    });

    // Implementing expandable a11y list
    this.dom.addEventListener('keydown', (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        this.handleClick();
        event.preventDefault();
      }
      else if (event.code === 'ArrowLeft') {
        this.callbacks.onSelected(-1);
      }
      else if (event.code === 'ArrowRight') {
        this.callbacks.onSelected(1);
      }
    });
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
   * Handle click on snippet.
   */
  handleClick() {
    this.callbacks.onClicked({
      id: this.params.id,
      time: this.params.startTime
    });
  }

  /**
   * Highlight snippet.
   */
  highlight() {
    this.dom.classList.add('highlight');
  }

  /**
   * Unhighlight snippet.
   */
  unhighlight() {
    this.dom.classList.remove('highlight');
  }

  /**
   * Focus snippet.
   */
  focus() {
    this.dom.focus();
  }

  /**
   * Set snippet to be tabbable.
   *
   * @param {boolean} state If true, is tabbable. If false, untabbable.
   */
  setTabbable(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.dom.setAttribute('tabindex', (state) ? 0 : -1);
  }

  /**
   * Show timestamp.
   *
   * @param {boolean} state If true, show. If false, hide.
   */
  setTimestamp(state) {
    if (typeof state !== 'boolean') {
      return;
    }

    this.dom.innerText = state ?
      `[${Util.toTimecode(this.params.startTime)}] ${this.params.text}` :
      this.params.text;
  }

  /**
   * Determine whether snipped would be displayed at time.
   *
   * @param {number} time Time to check.
   * @returns {boolean} True, if snipped would be displayed at time.
   */
  isDisplayedAt(time) {
    if (typeof time !== 'number') {
      return false;
    }

    return time >= this.params.startTime && time < this.params.endTime;
  }
}
