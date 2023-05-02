import Dictionary from '@services/dictionary';
import Util from '@services/util';
import FocusTrap from '@services/focus-trap';
import './modal-overlay.scss';

/** Class representing an overlay */
export default class ModalOverlay {

  /**
   * Overlay holding content.
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} [callbacks.onClosed] Callback when exercise closed.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);

    this.callbacks = Util.extend({
      onClosed: () => {}
    }, callbacks);

    this.handleGlobalClick = this.handleGlobalClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-modal-overlay');
    this.dom.setAttribute('role', 'dialog');
    this.dom.setAttribute('aria-modal', 'true');

    // Container for H5P content, can be CSS-transformed
    this.contentContainer = document.createElement('div');
    this.contentContainer.classList.add('h5p-modal-overlay-container');
    this.dom.append(this.contentContainer);

    this.content = document.createElement('div');
    this.content.classList.add('h5p-modal-overlay-content');
    this.contentContainer.append(this.content);

    // Close button
    this.buttonClose = document.createElement('button');
    this.buttonClose.classList.add('h5p-modal-overlay-button-close');
    this.buttonClose.setAttribute('aria-label', Dictionary.get('a11y.close'));
    this.buttonClose.addEventListener('click', () => {
      this.callbacks.onClosed();
    });
    this.contentContainer.append(this.buttonClose);

    // Headline
    const headline = document.createElement('div');
    headline.classList.add('h5p-modal-overlay-headline');
    this.content.append(headline);

    this.headlineText = document.createElement('div');
    this.headlineText.classList.add('h5p-modal-overlay-headline-text');
    headline.append(this.headlineText);

    // Content
    this.h5pInstance = document.createElement('div');
    this.h5pInstance.classList.add('h5p-modal-overlay-foo');
    this.content.append(this.h5pInstance);

    this.focusTrap = new FocusTrap({ trapElement: this.dom });

    this.hide();
  }

  /**
   * Get DOM for exercise.
   * @returns {HTMLElement} DOM for exercise.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');

    // Wait to allow DOM to progress
    window.requestAnimationFrame(() => {
      this.focusTrap.activate();
      document.addEventListener('click', this.handleGlobalClick);
      document.addEventListener('keydown', this.handleKeyDown);
    });
  }

  /**
   * Hide.
   */
  hide() {
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleKeyDown);

    this.dom.classList.add('display-none');
    this.focusTrap.deactivate();
  }

  /**
   * Set DOM of content.
   * @param {HTMLElement} dom DOM of content.
   */
  setContentDOM(dom) {
    this.h5pInstance.innerHTML = '';
    this.h5pInstance.append(dom);
  }

  /**
   * Set headline text.
   * @param {string} text Headline text to set.
   */
  setTitle(text) {
    this.headlineText.innerText = text;
    this.dom.setAttribute('aria-label', text);
  }

  /**
   * Get computed size.
   * @returns {object} Size with width and height.
   */
  getSize() {
    const rect = this.dom.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  /**
   * Handle global click event.
   * @param {Event} event Click event.
   */
  handleGlobalClick(event) {
    if (
      !this.content.contains(event.target) &&
      event.target.isConnected // Content may have removed element already
    ) {
      this.callbacks.onClosed();
    }
  }

  /**
   * Handle key down.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.callbacks.onClosed();
    }
  }
}
