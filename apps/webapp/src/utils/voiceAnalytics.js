/**
 * Voice Analytics Utility
 * Tracks voice feature usage, errors, and performance metrics
 */

/**
 * Analytics event types
 */
const EVENT_TYPES = {
  VOICE_MODE_STARTED: 'voice_mode_started',
  VOICE_MODE_STOPPED: 'voice_mode_stopped',
  RECORDING_STARTED: 'recording_started',
  RECORDING_COMPLETED: 'recording_completed',
  RECORDING_ERROR: 'recording_error',
  TRANSCRIPTION_COMPLETE: 'transcription_complete',
  TTS_STARTED: 'tts_started',
  TTS_COMPLETED: 'tts_completed',
  TTS_ERROR: 'tts_error',
  VOICE_COMMAND: 'voice_command',
  SETTINGS_CHANGED: 'settings_changed',
  PERMISSION_DENIED: 'permission_denied',
};

/**
 * Analytics storage key
 */
const ANALYTICS_KEY = 'voiceAnalytics';

/**
 * Maximum number of events to store locally
 */
const MAX_EVENTS = 1000;

/**
 * Get analytics data from localStorage
 * @returns {Array} Array of analytics events
 */
const getAnalyticsData = () => {
  try {
    const saved = localStorage.getItem(ANALYTICS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading analytics data:', error);
    return [];
  }
};

/**
 * Save analytics data to localStorage
 * @param {Array} events - Array of events to save
 */
const saveAnalyticsData = (events) => {
  try {
    // Keep only the most recent events
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving analytics data:', error);
  }
};

/**
 * Track an analytics event
 * @param {string} eventType - Type of event
 * @param {Object} data - Event data
 */
export const trackEvent = (eventType, data = {}) => {
  const event = {
    type: eventType,
    timestamp: Date.now(),
    data,
  };

  const events = getAnalyticsData();
  events.push(event);
  saveAnalyticsData(events);

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log('[Voice Analytics]', eventType, data);
  }
};

/**
 * Get analytics summary
 * @returns {Object} Summary statistics
 */
export const getAnalyticsSummary = () => {
  const events = getAnalyticsData();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recentEvents = events.filter((e) => e.timestamp > oneDayAgo);
  const weekEvents = events.filter((e) => e.timestamp > oneWeekAgo);

  const summary = {
    totalEvents: events.length,
    eventsLast24h: recentEvents.length,
    eventsLastWeek: weekEvents.length,
    voiceModeSessions: events.filter((e) => e.type === EVENT_TYPES.VOICE_MODE_STARTED).length,
    recordings: events.filter((e) => e.type === EVENT_TYPES.RECORDING_COMPLETED).length,
    errors: events.filter(
      (e) => e.type === EVENT_TYPES.RECORDING_ERROR || e.type === EVENT_TYPES.TTS_ERROR
    ).length,
    voiceCommands: events.filter((e) => e.type === EVENT_TYPES.VOICE_COMMAND).length,
    permissionDenied: events.filter((e) => e.type === EVENT_TYPES.PERMISSION_DENIED).length,
  };

  // Calculate average transcription time
  const transcriptionEvents = events.filter(
    (e) => e.type === EVENT_TYPES.TRANSCRIPTION_COMPLETE && e.data.duration
  );
  if (transcriptionEvents.length > 0) {
    const totalDuration = transcriptionEvents.reduce((sum, e) => sum + e.data.duration, 0);
    summary.avgTranscriptionTime = totalDuration / transcriptionEvents.length;
  }

  // Calculate average TTS duration
  const ttsEvents = events.filter((e) => e.type === EVENT_TYPES.TTS_COMPLETED && e.data.duration);
  if (ttsEvents.length > 0) {
    const totalDuration = ttsEvents.reduce((sum, e) => sum + e.data.duration, 0);
    summary.avgTTSDuration = totalDuration / ttsEvents.length;
  }

  return summary;
};

/**
 * Clear analytics data
 */
export const clearAnalytics = () => {
  try {
    localStorage.removeItem(ANALYTICS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing analytics:', error);
    return false;
  }
};

/**
 * Export analytics data (for debugging or external analysis)
 * @returns {string} JSON string of analytics data
 */
export const exportAnalytics = () => {
  const events = getAnalyticsData();
  return JSON.stringify(events, null, 2);
};

/**
 * Track voice mode started
 */
export const trackVoiceModeStarted = () => {
  trackEvent(EVENT_TYPES.VOICE_MODE_STARTED);
};

/**
 * Track voice mode stopped
 * @param {number} duration - Duration in milliseconds
 */
export const trackVoiceModeStopped = (duration) => {
  trackEvent(EVENT_TYPES.VOICE_MODE_STOPPED, { duration });
};

/**
 * Track recording started
 */
export const trackRecordingStarted = () => {
  trackEvent(EVENT_TYPES.RECORDING_STARTED);
};

/**
 * Track recording completed
 * @param {number} duration - Duration in milliseconds
 * @param {number} transcriptionTime - Time to transcribe in milliseconds
 */
export const trackRecordingCompleted = (duration, transcriptionTime) => {
  trackEvent(EVENT_TYPES.RECORDING_COMPLETED, { duration, transcriptionTime });
};

/**
 * Track recording error
 * @param {string} error - Error message
 * @param {string} errorType - Type of error
 */
export const trackRecordingError = (error, errorType) => {
  trackEvent(EVENT_TYPES.RECORDING_ERROR, { error, errorType });
};

/**
 * Track transcription complete
 * @param {number} duration - Duration in milliseconds
 * @param {number} wordCount - Number of words transcribed
 */
export const trackTranscriptionComplete = (duration, wordCount) => {
  trackEvent(EVENT_TYPES.TRANSCRIPTION_COMPLETE, { duration, wordCount });
};

/**
 * Track TTS started
 * @param {number} characterCount - Number of characters to speak
 */
export const trackTTSStarted = (characterCount) => {
  trackEvent(EVENT_TYPES.TTS_STARTED, { characterCount });
};

/**
 * Track TTS completed
 * @param {number} duration - Duration in milliseconds
 */
export const trackTTSCompleted = (duration) => {
  trackEvent(EVENT_TYPES.TTS_COMPLETED, { duration });
};

/**
 * Track TTS error
 * @param {string} error - Error message
 */
export const trackTTSError = (error) => {
  trackEvent(EVENT_TYPES.TTS_ERROR, { error });
};

/**
 * Track voice command
 * @param {string} command - Command name
 */
export const trackVoiceCommand = (command) => {
  trackEvent(EVENT_TYPES.VOICE_COMMAND, { command });
};

/**
 * Track settings changed
 * @param {string} setting - Setting name that changed
 */
export const trackSettingsChanged = (setting) => {
  trackEvent(EVENT_TYPES.SETTINGS_CHANGED, { setting });
};

/**
 * Track permission denied
 * @param {string} permission - Permission type
 */
export const trackPermissionDenied = (permission) => {
  trackEvent(EVENT_TYPES.PERMISSION_DENIED, { permission });
};

export default {
  trackEvent,
  getAnalyticsSummary,
  clearAnalytics,
  exportAnalytics,
  trackVoiceModeStarted,
  trackVoiceModeStopped,
  trackRecordingStarted,
  trackRecordingCompleted,
  trackRecordingError,
  trackTranscriptionComplete,
  trackTTSStarted,
  trackTTSCompleted,
  trackTTSError,
  trackVoiceCommand,
  trackSettingsChanged,
  trackPermissionDenied,
  EVENT_TYPES,
};
