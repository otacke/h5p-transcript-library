import './select-box.scss';
import Util from './../../util';
import Dictionary from './../../services/dictionary';

export default class SelectBox {
  /**
   * @class
   * @param {object} [params={}] Parameters passed by the editor.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} callbacks.onChanged field changed callback.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      options: [],
      selectedId: 0
    }, params);

    this.callbacks = Util.extend({
      onChanged: () => {}
    }, callbacks);

    this.handleKeydown = this.handleKeydown.bind(this);

    this.dom = document.createElement('div');
    this.dom.classList.add('selectbox');

    this.selectField = document.createElement('select');
    this.selectField.classList.add('selectbox-select');
    this.selectField.setAttribute(
      'aria-label', Dictionary.get('a11y.selectField')
    );
    this.selectField.addEventListener('change', () => {
      this.callbacks.onChanged(parseInt(this.selectField.value));
    });

    this.params.options.forEach((option, index) => {
      const optionField = document.createElement('option');
      optionField.value = index.toString();
      optionField.innerText = option;

      if (index === this.params.selectedId) {
        optionField.setAttribute('selected', 'selected');
      }

      this.selectField.appendChild(optionField);
    });

    this.dom.appendChild(this.selectField);
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

  /**
   * Enable.
   */
  enable() {
    this.selectField.classList.remove('disabled');
    this.selectField.setAttribute(
      'aria-label', Dictionary.get('a11y.selectField')
    );

    this.selectField.removeEventListener('keydown', this.handleKeydown);
  }

  /**
   * Disable. Field should still be tabbable, but not interactive.
   */
  disable() {
    this.selectField.classList.add('disabled');
    this.selectField.setAttribute(
      'aria-label', Dictionary.get('a11y.selectFieldDisabled')
    );
    this.selectField.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Handle key down event.
   *
   * @param {KeyboardEvent} event Keydown event.
   */
  handleKeydown(event) {
    // Block space and enter.
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      return;
    }
  }
}
