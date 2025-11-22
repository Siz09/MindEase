/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled in the frontend.
 * Features can be toggled via environment variables for gradual rollout.
 *
 * Usage:
 *   import { isFeatureEnabled } from '@/config/featureFlags';
 *
 *   if (isFeatureEnabled('safetyBanners')) {
 *     // Render safety banner
 *   }
 */

export const featureFlags = {
  // Safety & Crisis Detection
  safetyBanners: import.meta.env.VITE_FEATURE_SAFETY_BANNERS !== 'false',
  crisisResources: import.meta.env.VITE_FEATURE_CRISIS_RESOURCES !== 'false',

  // Mood Tracking
  moodPrompts: import.meta.env.VITE_FEATURE_MOOD_PROMPTS !== 'false',
  moodTrends: import.meta.env.VITE_FEATURE_MOOD_TRENDS !== 'false',

  // Session Features
  sessionSummaries: import.meta.env.VITE_FEATURE_SESSION_SUMMARIES === 'true',

  // Advanced Features (disabled by default)
  voiceInput: import.meta.env.VITE_FEATURE_VOICE_INPUT === 'true',
  voiceOutput: import.meta.env.VITE_FEATURE_VOICE_OUTPUT === 'true',
  voiceConversation: import.meta.env.VITE_FEATURE_VOICE_CONVERSATION === 'true',

  // UI Enhancements
  animations: import.meta.env.VITE_FEATURE_ANIMATIONS !== 'false',
  darkMode: import.meta.env.VITE_FEATURE_DARK_MODE !== 'false',
};

/**
 * Check if a feature is enabled.
 *
 * @param {string} feature - The feature name to check
 * @returns {boolean} true if the feature is enabled
 */
export const isFeatureEnabled = (feature) => {
  return featureFlags[feature] === true;
};

/**
 * Get all enabled features as an array.
 *
 * @returns {string[]} Array of enabled feature names
 */
export const getEnabledFeatures = () => {
  return Object.keys(featureFlags).filter((key) => featureFlags[key] === true);
};

/**
 * Get all disabled features as an array.
 *
 * @returns {string[]} Array of disabled feature names
 */
export const getDisabledFeatures = () => {
  return Object.keys(featureFlags).filter((key) => featureFlags[key] === false);
};

/**
 * Log feature flags status (for debugging).
 */
export const logFeatureFlags = () => {
  console.group('🚩 Feature Flags');
  console.log('Enabled:', getEnabledFeatures());
  console.log('Disabled:', getDisabledFeatures());
  console.groupEnd();
};

// Log feature flags in development mode
if (import.meta.env.DEV) {
  logFeatureFlags();
}

export default featureFlags;
