/**
 * Chat Intent Detection Utility
 * Detects user intent for breathing exercises and meditation from message content
 */

// Keywords that indicate breathing exercise intent
const BREATHING_KEYWORDS = [
  'breathing',
  'breath',
  'breathe',
  'calm down',
  'calm me',
  'relax',
  'relaxing',
  'anxiety',
  'anxious',
  'stressed',
  'stress',
  'panic',
  'panicking',
  'hyperventilate',
  'deep breath',
  '4-7-8',
  'box breathing',
];

// Keywords that indicate meditation intent
const MEDITATION_KEYWORDS = [
  'meditation',
  'meditate',
  'mindful',
  'mindfulness',
  'focus',
  'concentrate',
  'timer',
  'quiet my mind',
  'clear my mind',
  'peaceful',
  'zen',
  'present moment',
];

// Phrases that strongly indicate intent (higher confidence)
const BREATHING_PHRASES = [
  'breathing exercise',
  'breathing technique',
  'help me breathe',
  'teach me to breathe',
  'need to calm down',
  'feeling anxious',
  'having a panic',
  "can't breathe",
];

const MEDITATION_PHRASES = [
  'meditation session',
  'meditation timer',
  'want to meditate',
  'help me meditate',
  'guided meditation',
  'start meditation',
  'begin meditation',
];

/**
 * Detects user intent from a message
 * @param {string} message - The user's message content
 * @returns {{ type: 'breathing' | 'meditation' | null, confidence: number, matchedKeyword: string | null }}
 */
export const detectIntent = (message) => {
  if (!message || typeof message !== 'string') {
    return { type: null, confidence: 0, matchedKeyword: null };
  }

  const lower = message.toLowerCase().trim();

  // Check for high-confidence phrases first
  for (const phrase of BREATHING_PHRASES) {
    if (lower.includes(phrase)) {
      return { type: 'breathing', confidence: 0.95, matchedKeyword: phrase };
    }
  }

  for (const phrase of MEDITATION_PHRASES) {
    if (lower.includes(phrase)) {
      return { type: 'meditation', confidence: 0.95, matchedKeyword: phrase };
    }
  }

  // Check for individual keywords (lower confidence)
  for (const keyword of BREATHING_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { type: 'breathing', confidence: 0.75, matchedKeyword: keyword };
    }
  }

  for (const keyword of MEDITATION_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { type: 'meditation', confidence: 0.75, matchedKeyword: keyword };
    }
  }

  return { type: null, confidence: 0, matchedKeyword: null };
};

/**
 * Checks if a message indicates a request for breathing exercise
 * @param {string} message - The user's message content
 * @returns {boolean}
 */
export const isBreathingRequest = (message) => {
  const intent = detectIntent(message);
  return intent.type === 'breathing' && intent.confidence >= 0.7;
};

/**
 * Checks if a message indicates a request for meditation
 * @param {string} message - The user's message content
 * @returns {boolean}
 */
export const isMeditationRequest = (message) => {
  const intent = detectIntent(message);
  return intent.type === 'meditation' && intent.confidence >= 0.7;
};

/**
 * Gets appropriate response text for detected intent
 * @param {string} intentType - 'breathing' | 'meditation'
 * @returns {string}
 */
export const getIntentResponseText = (intentType) => {
  if (intentType === 'breathing') {
    return "I'd be happy to help you with a breathing exercise! Choose a pattern that suits you:";
  }
  if (intentType === 'meditation') {
    return "Let's begin a meditation session. Set your preferred duration and start when you're ready:";
  }
  return '';
};

export default {
  detectIntent,
  isBreathingRequest,
  isMeditationRequest,
  getIntentResponseText,
};
