import './search-box.scss';
import Util from '@services/util';
import Dictionary from '@services/dictionary';

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

    this.icon = document.createElement('div');
    this.icon.classList.add('searchbox-icon');
    this.icon.addEventListener('click', () => {
      this.inputField.focus();
    });
    this.dom.appendChild(this.icon);

    this.inputField = document.createElement('input');
    this.inputField.classList.add('searchbox-input');
    this.inputField.setAttribute('aria-label', Dictionary.get('a11y.enterToHighlight'));
    this.inputField.addEventListener('keyup', () => {
      clearTimeout(this.keyupTimeout);
      this.keyupTimeout = setTimeout(() => {
        this.callbacks.onSearchChanged(this.inputField.value);
      }, 500); // Don't call on every quick key stroke
    });
    this.dom.appendChild(this.inputField);
  }

  /**
   * Get search box DOM element.
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

  /**
   * Enable.
   */
  enable() {
    this.icon.classList.remove('disabled');
    this.inputField.classList.remove('disabled');
    this.inputField.removeAttribute('readonly');
    this.inputField.setAttribute('aria-label', Dictionary.get('a11y.enterToHighlight'));
  }

  /**
   * Enable.
   */
  disable() {
    this.icon.classList.add('disabled');
    this.inputField.classList.add('disabled');
    this.inputField.setAttribute('readonly', 'readonly');
    this.inputField.setAttribute('aria-label', Dictionary.get('a11y.searchboxDisabled'));
  }

  /**
   * Set attribute.
   * @param {string} attribute Attribute key.
   * @param {string} value Attribute value.
   */
  setAttribute(attribute, value) {
    this.inputField.setAttribute(attribute, value);
  }

  /**
   * Focus.
   */
  focus() {
    this.inputField.focus();
  }
}
