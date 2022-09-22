import './search-box.scss';
import Util from './../../util';
import Dictionary from './../../services/dictionary';

export default class SearchBox {
  /**
   * @class
   * @param {object} [params={}] Parameters passed by the editor.
   * @param {boolean} [params.visible=true] If true, visible. If false, not.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} callbacks.onSearchChanged Search changed callback.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({ visible: true }, params);

    this.callbacks = Util.extend({ onSearchChange: () => {} }, callbacks);

    this.dom = document.createElement('div');
    this.dom.classList.add('searchbox');
    if (!params.visible) {
      this.hide();
    }

    const icon = document.createElement('div');
    icon.classList.add('searchbox-icon');
    this.dom.appendChild(icon);

    const searchBox = document.createElement('input');
    searchBox.classList.add('searchbox-input');
    searchBox.setAttribute('aria-label', Dictionary.get('enterToHighlight'));
    searchBox.addEventListener('keyup', () => {
      this.callbacks.onSearchChanged(searchBox.value);
    });
    this.dom.appendChild(searchBox);
  }

  /**
   * Get search box DOM element.
   *
   * @returns {HTMLElement} Search box DOM element.
   */
  getDOM() {
    return this.dom;
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
}
