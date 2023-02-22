export default class FocusTrap {

  /**
   * Simple focus trap.
   *
   * @class
   * @param {object} [params={}] Parameters.
   * @param {HTMLElement} params.trapElement Element to be made a trap.
   * @param {HTMLElement} [params.initialFocus] Element to get initial focus.
   */
  constructor(params = {}) {
    this.handleKeydownEvent = this.handleKeydownEvent.bind(this);

    this.attachTo(params);
  }

  /**
   * Attach focus trap.
   *
   * @param {object} [params={}] Parameters.
   * @param {HTMLElement} params.trapElement Element to be made a trap.
   * @param {HTMLElement} [params.initialFocus] Element to get initial focus.
   */
  attachTo(params = {}) {
    this.params = params;
    this.focusableElements = [];
  }

  /**
   * Activate.
   */
  activate() {
    if (!this.params.trapElement) {
      return;
    }

    if (this.isActivated) {
      return;
    }

    this.isActivated = true;

    // iOS is behind ... Again ...
    const callback = window.requestIdleCallback ?
      window.requestIdleCallback :
      window.requestAnimationFrame;

    callback(() => {
      this.observer = this.observer || new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.observer.unobserve(this.params.trapElement);

          this.handleVisible();
        }
      }, {
        root: document.documentElement,
        threshold: 0
      });
      this.observer.observe(this.params.trapElement);
    });
  }

  /**
   * Deactivate.
   */
  deactivate() {
    if (!this.isActivated) {
      return;
    }

    this.observer?.unobserve(this.params.trapElement);

    this.params.trapElement
      .removeEventListener('keydown', this.handleKeydownEvent, true);
    this.isActivated = false;
  }

  /**
   * Update list of focusable elements.
   */
  updateFocusableElements() {
    if (!this.params.trapElement) {
      return;
    }

    this.focusableElements = this.getFocusableElements(this.params.trapElement);
  }

  /**
   * Get focusable elements within container.
   *
   * @param {HTMLElement} container Container to look in.
   * @returns {HTMLElement[]|undefined} Focusable elements within container.
   */
  getFocusableElements(container) {
    if (!container) {
      return;
    }

    const focusableElementsString = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'video',
      'audio',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return []
      .slice
      .call(container.querySelectorAll(focusableElementsString))
      .filter((element) => {
        return element.getAttribute('disabled') !== 'true' &&
          element.getAttribute('disabled') !== true;
      });
  }

  /**
   * Check whether HTML element is child of trap.
   *
   * @param {HTMLElement} element Element to check.
   * @returns {boolean} True, if element is child.
   */
  isChild(element) {
    if (!this.params.trapElement) {
      return false;
    }

    const parent = element.parentNode;

    if (!parent) {
      return false;
    }

    if (parent === this.params.trapElement) {
      return true;
    }

    return this.isChild(parent);
  }

  /**
   * Handle visible.
   */
  handleVisible() {
    this.updateFocusableElements();

    this.params.trapElement.addEventListener(
      'keydown', this.handleKeydownEvent, true
    );

    this.currentFocusElement = null;

    if (this.params.initialFocus && this.isChild(this.params.initialFocus)) {
      this.currentFocusElement = this.params.initialFocus;
    }

    if (!this.currentFocusElement && this.focusableElements.length) {
      if (
        this.focusableElements[0] === this.params.closeElement &&
        this.params.fallbackContainer?.firstChild &&
        this.focusableElements.length === 1
      ) {
        /*
         * Advisable to set tabindex -1 and focus on static element instead of
         * focusing the close button and not announcing anything
         * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/
         */
        this.params.fallbackContainer.firstChild.setAttribute('tabindex', '-1');
        this.currentFocusElement = this.params.fallbackContainer.firstChild;
      }
      else {
        this.currentFocusElement = this.focusableElements[0];
      }

    }

    if (this.currentFocusElement) {
      this.currentFocusElement.focus();
    }
  }

  /**
   * Handle keyboard event.
   *
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeydownEvent(event) {
    // Some previously available elements may have an updated tabindex
    this.updateFocusableElements();

    if (!this.focusableElements.length) {
      return; // No focusable elements
    }

    if (event.key !== 'Tab') {
      return; // we only care about the tab key
    }

    event.preventDefault();

    const index = this.focusableElements.findIndex((element) => {
      return element === this.currentFocusElement;
    });

    const length = this.focusableElements.length;

    const newIndex = (event.shiftKey) ?
      (index + length - 1) % length :
      (index + 1) % length;

    this.currentFocusElement = this.focusableElements[newIndex];
    this.currentFocusElement.focus();
  }
}
