/**
 * Voice Settings Manager
 * Handles versioning, migration, validation, and persistence of voice settings
 */

const SETTINGS_KEY = 'voiceSettings';
const CURRENT_VERSION = 2; // Increment when schema changes

/**
 * Default settings schema
 */
const DEFAULT_SETTINGS = {
  version: CURRENT_VERSION,
  voiceInputEnabled: true,
  voiceOutputEnabled: false,
  speechRate: 1.0,
  volume: 1.0,
  selectedVoice: null,
  vadThreshold: 0.02, // Voice Activity Detection threshold
  cooldownPeriod: 350, // Cooldown period in ms
};

/**
 * Settings schema versions and their structures
 */
const SCHEMA_VERSIONS = {
  1: {
    voiceInputEnabled: true,
    voiceOutputEnabled: false,
    speechRate: 1.0,
    volume: 1.0,
    selectedVoice: null,
  },
  2: {
    ...DEFAULT_SETTINGS,
  },
};

/**
 * Migrate settings from old version to new version
 * @param {Object} oldSettings - Settings from old version
 * @param {number} fromVersion - Source version
 * @param {number} toVersion - Target version
 * @returns {Object} Migrated settings
 */
const migrateSettings = (oldSettings, fromVersion, toVersion) => {
  let migrated = { ...oldSettings };

  // Migrate from version 1 to 2
  if (fromVersion === 1 && toVersion === 2) {
    // Add new fields with defaults
    migrated.vadThreshold = DEFAULT_SETTINGS.vadThreshold;
    migrated.cooldownPeriod = DEFAULT_SETTINGS.cooldownPeriod;
    migrated.version = 2;
  }

  return migrated;
};

/**
 * Validate settings structure
 * @param {Object} settings - Settings to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validateSettings = (settings) => {
  const errors = [];

  if (typeof settings !== 'object' || settings === null) {
    return { isValid: false, errors: ['Settings must be an object'] };
  }

  // Validate voiceInputEnabled
  if (settings.voiceInputEnabled !== undefined && typeof settings.voiceInputEnabled !== 'boolean') {
    errors.push('voiceInputEnabled must be a boolean');
  }

  // Validate voiceOutputEnabled
  if (
    settings.voiceOutputEnabled !== undefined &&
    typeof settings.voiceOutputEnabled !== 'boolean'
  ) {
    errors.push('voiceOutputEnabled must be a boolean');
  }

  // Validate speechRate
  if (settings.speechRate !== undefined) {
    if (
      typeof settings.speechRate !== 'number' ||
      settings.speechRate < 0.1 ||
      settings.speechRate > 10
    ) {
      errors.push('speechRate must be a number between 0.1 and 10');
    }
  }

  // Validate volume
  if (settings.volume !== undefined) {
    if (typeof settings.volume !== 'number' || settings.volume < 0 || settings.volume > 1) {
      errors.push('volume must be a number between 0 and 1');
    }
  }

  // Validate vadThreshold
  if (settings.vadThreshold !== undefined) {
    if (
      typeof settings.vadThreshold !== 'number' ||
      settings.vadThreshold < 0 ||
      settings.vadThreshold > 1
    ) {
      errors.push('vadThreshold must be a number between 0 and 1');
    }
  }

  // Validate cooldownPeriod
  if (settings.cooldownPeriod !== undefined) {
    if (
      typeof settings.cooldownPeriod !== 'number' ||
      settings.cooldownPeriod < 0 ||
      settings.cooldownPeriod > 5000
    ) {
      errors.push('cooldownPeriod must be a number between 0 and 5000');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Load settings from localStorage with migration and validation
 * @returns {Object} Loaded and validated settings
 */
export const loadVoiceSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) {
      // No settings found, return defaults
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(saved);
    const version = parsed.version || 1; // Assume version 1 if not specified

    // Migrate if needed
    let settings = parsed;
    if (version < CURRENT_VERSION) {
      console.log(`Migrating voice settings from version ${version} to ${CURRENT_VERSION}`);
      settings = migrateSettings(parsed, version, CURRENT_VERSION);
      // Save migrated settings
      saveVoiceSettings(settings);
    }

    // Validate settings
    const validation = validateSettings(settings);
    if (!validation.isValid) {
      console.warn('Invalid voice settings detected:', validation.errors);
      // Merge with defaults to fix invalid values
      settings = { ...DEFAULT_SETTINGS, ...settings };
      // Re-validate after merge
      const revalidation = validateSettings(settings);
      if (!revalidation.isValid) {
        console.error('Settings still invalid after merge, using defaults');
        return { ...DEFAULT_SETTINGS };
      }
    }

    // Ensure all required fields are present
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    merged.version = CURRENT_VERSION;

    return merged;
  } catch (error) {
    console.error('Error loading voice settings:', error);
    // Return defaults on error
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Save settings to localStorage with validation
 * @param {Object} settings - Settings to save (partial update)
 * @returns {boolean} Success status
 */
export const saveVoiceSettings = (settings) => {
  try {
    // Load existing settings
    const existing = loadVoiceSettings();

    // Merge with new settings
    const merged = { ...existing, ...settings };
    merged.version = CURRENT_VERSION;

    // Validate before saving
    const validation = validateSettings(merged);
    if (!validation.isValid) {
      console.error('Cannot save invalid settings:', validation.errors);
      return false;
    }

    // Save to localStorage
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));

    // Dispatch custom event for same-tab reactivity
    window.dispatchEvent(new Event('voiceSettingsChanged'));

    return true;
  } catch (error) {
    console.error('Error saving voice settings:', error);
    return false;
  }
};

/**
 * Reset settings to defaults
 * @returns {boolean} Success status
 */
export const resetVoiceSettings = () => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    window.dispatchEvent(new Event('voiceSettingsChanged'));
    return true;
  } catch (error) {
    console.error('Error resetting voice settings:', error);
    return false;
  }
};

/**
 * Get default settings
 * @returns {Object} Default settings
 */
export const getDefaultSettings = () => {
  return { ...DEFAULT_SETTINGS };
};

export default {
  loadVoiceSettings,
  saveVoiceSettings,
  resetVoiceSettings,
  getDefaultSettings,
  validateSettings,
  CURRENT_VERSION,
};
