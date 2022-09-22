import Util from './util';

export default class TimeTracker {
  /**
   * Track H5P media instance time updates.
   *
   * @class
   * @param {object} params Parameters.
   * @param {H5P.ContentType} params.instance H5P content instance.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} callbacks.onTimeUpdated Callback for when time updated.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      instance: {}
    }, params);

    this.callbacks = Util.extend({
      onTimeUpdated: () => {}
    }, callbacks);

    // Keep track whether tracking is active
    this.isTracking = false;

    // Bind instance to handler
    this.handleAudio = this.handleAudio.bind(this);
  }

  /**
   * Handle H5P.Audio instance.
   */
  handleAudio() {
    this.handleTime(this.params.instance.audio?.currentTime);
  }

  /**
   * Start tracking.
   */
  start() {
    if (this.isTracking) {
      return; // Nothing to do.
    }

    const machineName = this.params.instance.libraryInfo?.machineName;
    let pollInstance;

    // Prefer native event handling for content types that allow
    if (machineName === 'H5P.Audio') {
      this.params.instance.audio?.addEventListener(
        'timeupdate',
        this.handleAudio
      );
      this.isTracking = true;
      return;
    }

    if (machineName === 'H5P.InteractiveVideo') {
      pollInstance = this.params.instance?.video;
    }
    else if (machineName === 'H5P.Video') {
      pollInstance = this.params.instance;
    }

    // Poll instance in regular intervals to get current time
    if (pollInstance && typeof pollInstance.getCurrentTime === 'function') {
      this.trackingTimeout = setInterval(() => {
        this.handleVideo(pollInstance);
      }, TimeTracker.POLL_INTERVAL_MS);

      this.isTracking = true;
    }
  }

  /**
   * Stop tracking.
   */
  stop() {
    if (!this.isTracking) {
      return; // Nothing to do.
    }

    // Remove listeners
    const machineName = this.params.instance?.libraryInfo?.machineName;
    if (machineName === 'H5P.Audio') {
      this.params.instance?.audio?.removeEventListener(
        'timeupdate', this.handleAudio
      );
    }

    // Remove polling
    clearInterval(this.trackingTimeout);

    this.isTracking = false;
  }

  /**
   * Handle H5P.Video instance.
   *
   * @param {H5P.ContentType} pollInstance H5P.Video instance.
   */
  handleVideo(pollInstance) {
    this.handleTime(pollInstance.getCurrentTime());
  }

  /**
   * Handle time to check for update.
   *
   * @param {number} currentTime Time.
   */
  handleTime(currentTime) {
    if (typeof currentTime !== 'number') {
      return;
    }

    if (currentTime !== this.previousTime) {
      this.previousTime = currentTime;
      this.callbacks.onTimeUpdated(currentTime);
    }
  }
}

/** @constant {number} Default poll interval in ms */
TimeTracker.POLL_INTERVAL_MS = 250;
