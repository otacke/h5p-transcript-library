/** Class for utility functions */
export default class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (
            typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object'
          ) {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @returns {string} Output string.
   */
  static htmlDecode(input) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent;
  }

  /**
   * Retrieve string without HTML tags.
   * @param {string} html Input string.
   * @param {object} [options] Options.
   * @param {(string|object)[]} [options.keepTags] Tags to ignore when stripping.
   * @returns {string} Output string.
   */
  static stripHTML(html, options = {}) {
    if (!Array.isArray(options.keepTags)) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    }

    options.keepTags = options.keepTags
      .filter((tagObject) => {
        return (
          typeof tagObject === 'string' ||
          typeof tagObject.tag === 'string'
        );
      })
      .map((tagObject) => {
        if (typeof tagObject === 'string') {
          tagObject = { tag: tagObject };
        }

        if (typeof tagObject.keepAttributes !== 'boolean') {
          tagObject.keepAttributes = false;
        }

        return tagObject;
      });

    return html
      .replace(/<(\/?)(\w+)[^>]*\/?>/g, (original, endMark, tag) => {
        if (options.keepTags.every((tagObject) => tagObject.tag !== tag)) {
          return '';
        }

        if (endMark) {
          return `<${endMark}${tag}>`;
        }

        const tagObject = options.keepTags
          .find((tagObject) => tagObject.tag === tag);

        if (!tagObject.keepAttributes) {
          return `<${tag}>`;
        }

        return `<${original.substring(1, original.length - 1)}>`;
      })
      .replace(/<!--.*?-->/g, '');
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageCode Language tag.
   * @returns {string} Formatted language tag.
   */
  static formatLanguageCode(languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  }

  /**
   * Convert time in milliseconds to timecode.
   * @param {number} seconds The time in milliSeconds.
   * @returns {string|undefined} The humanized timecode.
   */
  static toTimecode(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
      return;
    }

    seconds = Math.floor(seconds); // Ignore ms

    // eslint-disable-next-line no-magic-numbers
    const hours = Math.floor(seconds / 3600);
    // eslint-disable-next-line no-magic-numbers
    seconds -= hours * 3600;

    // eslint-disable-next-line no-magic-numbers
    const minutes = Math.floor(seconds / 60);
    // eslint-disable-next-line no-magic-numbers
    seconds -= minutes * 60;

    let timecode = '';
    if (hours > 0) {
      timecode = `${hours}:`;
    }
    // eslint-disable-next-line no-magic-numbers
    timecode += (hours > 0 && minutes < 10) ? `0${minutes}:` : `${minutes}:`;
    // eslint-disable-next-line no-magic-numbers
    timecode += (seconds < 10) ? `0${seconds}` : `${seconds}`;

    return timecode;
  }
}
