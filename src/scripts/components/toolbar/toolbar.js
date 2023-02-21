import './toolbar.scss';
import ToolbarButton from './toolbar-button';
import SearchBox from './search-box';
import Util from './../../util';
import SelectBox from './select-box';

/** Class representing the button bar */
export default class Toolbar {

  /**
   * @class
   * @param {object} [params={}] Parameters.
   * @param {boolean} [params.hidden=false] If true, hide toolbar.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} [callbacks.onSearchChanged] Search field changed.
   * @param {function} [callbacks.onLanguageChanged] Language changed callback.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      buttons: [],
      hidden: false,
      searchbox: true,
      selectbox: []
    }, params);

    this.callbacks = Util.extend({
      onSearchChanged: () => {},
      onLanguageChanged: () => {}
    }, callbacks);

    this.buttons = {};

    // Build DOM
    this.dom = document.createElement('div');
    this.dom.classList.add('toolbar-tool-bar');
    this.dom.setAttribute('role', 'toolbar');

    this.dom.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });

    if (this.params.hidden) {
      this.hide();
    }

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.classList.add('toolbar-buttons');
    this.dom.appendChild(this.buttonsContainer);

    this.nonButtonsContainer = document.createElement('div');
    this.nonButtonsContainer.classList.add('toolbar-non-buttons');
    this.dom.appendChild(this.nonButtonsContainer);

    this.params.buttons.forEach((button) => {
      this.addButton(button);
    });

    if (this.params.selectbox.options.length > 1) {
      this.addSelectBox(this.params.selectbox);
    }

    this.addSearchBox({ visible: this.params.searchbox });

    // searchbox not part of elements, because then cursor keys don't work
    this.elements = [...Object.values(this.buttons), this.selectbox]
      .filter((element) => !!element);

    // Make first button active one
    Object.values(this.elements).forEach((element, index) => {
      element.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    this.currentElementIndex = 0;
  }

  /**
   * Return the DOM for this class.
   *
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Add button.
   *
   * @param {object} [button={}] Button parameters.
   */
  addButton(button = {}) {
    if (typeof button.id !== 'string') {
      return; // We need an id at least
    }

    this.buttons[button.id] = new ToolbarButton(
      {
        id: button.id,
        ...(button.a11y && { a11y: button.a11y }),
        classes: ['toolbar-button', `toolbar-button-${button.id}`],
        ...(typeof button.disabled === 'boolean' && {
          disabled: button.disabled
        }),
        ...(button.active && { active: button.active }),
        ...(button.type && { type: button.type }),
        ...(button.pulseStates && { pulseStates: button.pulseStates }),
        ...(button.pulseIndex && { pulseIndex: button.pulseIndex })
      },
      {
        ...(typeof button.onClick === 'function' && {
          onClick: (event, params) => {
            button.onClick(event, params);
          }
        })
      }
    );
    this.buttonsContainer.appendChild(this.buttons[button.id].getDOM());
  }

  /**
   * Add select box.
   *
   * @param {object} [params={}] Parameters.
   * @param {string[]} params.options Options.
   * @param {number} [params.selectedId] Index of selected option.
   */
  addSelectBox(params = {}) {
    this.selectbox = new SelectBox(
      params,
      {
        onChanged: (index) => {
          this.callbacks.onLanguageChanged(index);
        }
      }
    );
    this.nonButtonsContainer.append(this.selectbox.getDOM());
  }

  /**
   * Add search box.
   *
   * @param {object} [params={}] Parameters.
   * @param {boolean} [params.visible] If true, visible. If false, not.
   */
  addSearchBox(params = {}) {
    this.searchbox = new SearchBox(
      { visible: params.visible },
      {
        onSearchChanged: (text) => {
          this.callbacks.onSearchChanged(text);
        }
      }
    );
    this.nonButtonsContainer.appendChild(this.searchbox.getDOM());
  }

  /**
   * Move button focus.
   *
   * @param {number} offset Offset to move position by.
   */
  moveElementFocus(offset) {
    if (typeof offset !== 'number') {
      return;
    }
    if (
      this.currentElementIndex + offset < 0 ||
      this.currentElementIndex + offset > Object.keys(this.elements).length - 1
    ) {
      return; // Don't cycle
    }
    Object.values(this.elements)[this.currentElementIndex]
      .setAttribute('tabindex', '-1');
    this.currentElementIndex = this.currentElementIndex + offset;
    const focusElement = Object.values(this.elements)[this.currentElementIndex];
    focusElement.setAttribute('tabindex', '0');
    focusElement.focus();
  }

  /**
   * Handle key down.
   *
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeydown(event) {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') {
      this.moveElementFocus(-1);
    }
    else if (event.code === 'ArrowRight' || event.code === 'ArrowDown') {
      this.moveElementFocus(1);
    }
    else if (event.code === 'Home') {
      this.moveElementFocus(0 - this.currentElementIndex);
    }
    else if (event.code === 'End') {
      this.moveElementFocus(
        Object.keys(this.buttons).length - 1 - this.currentElementIndex
      );
    }
    else {
      return;
    }
    event.preventDefault();
  }

  /**
   * Set button attributes.
   *
   * @param {string} id Button id.
   * @param {object} attributes HTML attributes to set.
   */
  setButtonAttributes(id = '', attributes = {}) {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    for (let attribute in attributes) {
      this.buttons[id].setAttribute(attribute, attributes[attribute]);
    }
  }

  /**
   * Force button state.
   *
   * @param {string} id Button id.
   * @param {boolean|number} active If true, toggle active, else inactive.
   */
  forceButton(id = '', active) {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].force(active);
  }

  /**
   * Enable button.
   *
   * @param {string} id Button id.
   */
  enableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].enable();
  }

  /**
   * Disable button.
   *
   * @param {string} id Button id.
   */
  disableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].disable();
  }

  /**
   * Show button.
   *
   * @param {string} id Button id.
   */
  showButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].show();
  }

  /**
   * Hide button.
   *
   * @param {string} id Button id.
   */
  hideButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].hide();
  }

  /**
   * Decloak button.
   *
   * @param {string} id Button id.
   */
  decloakButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].decloak();
  }

  /**
   * Cloak button.
   *
   * @param {string} id Button id.
   */
  cloakButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].cloak();
  }

  /**
   * Focus an element.
   */
  focus() {
    Object.values(this.elements)[this.currentElementIndex]?.focus();
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
   * Show select field.
   */
  showSelectField() {
    this.selectbox.show();
  }

  /**
   * Hide select field.
   */
  hideSelectField() {
    this.selectbox.hide();
  }

  /**
   * Enable select field.
   */
  enableSelectField() {
    this.selectbox.enable();
  }

  /**
   * Disable select field.
   */
  disableSelectField() {
    this.selectbox.disable();
  }

  /**
   * Show search box.
   */
  showSearchbox() {
    this.searchbox.show();
  }

  /**
   * Hide search box.
   */
  hideSearchbox() {
    this.searchbox.hide();
  }

  /**
   * Enable search box.
   */
  enableSearchbox() {
    this.searchbox.enable();
  }

  /**
   * Disable search box.
   */
  disableSearchbox() {
    this.searchbox.disable();
  }
}
