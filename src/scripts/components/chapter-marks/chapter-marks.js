import Dictionary from '@services/dictionary';
import Util from '@services/util';
import ModalOverlay from '@components/modal-overlay/modal-overlay';
import './chapter-marks.scss';

/** Class representing an overlay */
export default class ChapterMarks {

  /**
   * Chapter marks
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object[]} [params.chapterMarks=[]] Chapter marks.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} [callbacks.onClosed] Callback when chapter marks closed.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      chapterMarks: []
    }, params);

    this.callbacks = Util.extend({
      onClosed: () => {},
      onChapterChanged: () => {}
    }, callbacks);

    this.time = 0;

    this.overlay = new ModalOverlay(
      {},
      {
        onClosed: () => {
          this.callbacks.onClosed();
        }
      }
    );
    this.dom = this.overlay.getDOM();

    const { list, buttons } = this.buildChooser(this.params.chapterMarks);
    this.buttons = buttons;

    this.overlay.setTitle(Dictionary.get('l10n.chapterMarks'));
    this.overlay.setContentDOM(list);
  }

  /**
   * Build chapter marks chooser.
   * @param {object[]} chapterMarks Chapter marks.
   * @returns {object} List and buttons.
   */
  buildChooser(chapterMarks) {
    const list = document.createElement('ol');
    list.classList.add('h5p-chapter-marks-list');

    const buttons = [];

    chapterMarks.forEach((chapterMark, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('h5p-chapter-marks-listitem');
      list.append(listItem);

      const button = document.createElement('button');
      button.classList.add('h5p-chapter-marks-button');
      button.addEventListener('click', () => {
        this.callbacks.onChapterChanged(chapterMark.time);
      });
      listItem.append(button);
      buttons.push(button);

      const number = document.createElement('span');
      number.classList.add('h5p-chapter-marks-number');
      number.innerText = index + 1;
      button.append(number);

      const label = document.createElement('span');
      label.classList.add('h5p-chapter-marks-label');
      label.innerHTML = chapterMark.label;
      button.append(label);

      const timecode = document.createElement('span');
      timecode.classList.add('h5p-chapter-marks-timecode');
      timecode.innerHTML = Util.toTimecode(chapterMark.time);
      button.append(timecode);
    });

    return {list: list, buttons: buttons};
  }

  /**
   * Get chapter marks DOM.
   * @returns {HTMLElement} Chapter marks DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Show.
   */
  show() {
    // Update option that matches last known time.
    this.highlightOption({ time: this.time });

    this.isOpen = true;
    this.overlay.show();
  }

  /**
   * Hide.
   */
  hide() {
    this.isOpen = false;
    this.overlay.hide();
  }

  /**
   * Update time.
   * @param {number} time Time.
   */
  updateTime(time) {
    this.time = time;

    if (this.isOpen) {
      this.highlightOption({ time: time });
    }
  }

  /**
   * Highligh option in chapter list.
   * @param {object} [params={}] Parameters.
   * @param {number} [params.id] Id of option to highlight. Preferred.
   * @param {number} [params.time] Time that identifies option best.
   */
  highlightOption(params = {}) {
    let id;

    if (typeof params.id !== 'number' && typeof params.time === 'number') {
      id = this.params.chapterMarks.filter((chaptermark) => {
        return chaptermark.time <= params.time;
      }).length - 1;
    }
    else if (typeof params.id === 'number') {
      id = params.id;
    }
    else {
      return;
    }

    id = Math.max(0, Math.min(id, this.buttons.length - 1));

    this.buttons.forEach((button, index) => {
      button.classList.toggle('active', index === id);
    });
  }
}
