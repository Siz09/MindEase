/**
 * Voice Commands Utility
 * Parses voice transcriptions to detect and execute voice commands
 */

/**
 * Command patterns and their actions
 */
const COMMAND_PATTERNS = {
  stop: {
    patterns: ['stop', 'halt', 'end', 'quit', 'cancel'],
    action: 'stop',
  },
  pause: {
    patterns: ['pause', 'wait', 'hold'],
    action: 'pause',
  },
  resume: {
    patterns: ['resume', 'continue', 'go on', 'play'],
    action: 'resume',
  },
  repeat: {
    patterns: ['repeat', 'say again', 'replay', 'read again'],
    action: 'repeat',
  },
  slower: {
    patterns: ['slower', 'slow down', 'reduce speed'],
    action: 'slower',
  },
  faster: {
    patterns: ['faster', 'speed up', 'increase speed'],
    action: 'faster',
  },
  louder: {
    patterns: ['louder', 'increase volume', 'volume up'],
    action: 'louder',
  },
  quieter: {
    patterns: ['quieter', 'reduce volume', 'volume down', 'lower volume'],
    action: 'quieter',
  },
};

/**
 * Normalize text for command matching
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Check if text matches any command pattern
 * @param {string} text - Transcribed text
 * @returns {string|null} Detected command action or null
 */
export const detectVoiceCommand = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const normalized = normalizeText(text);

  // Check each command pattern
  for (const [commandName, command] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of command.patterns) {
      // Check for exact match or if pattern is at the start of the text
      if (normalized === pattern || normalized.startsWith(pattern + ' ')) {
        return command.action;
      }
    }
  }

  return null;
};

/**
 * Check if text contains a voice command (not just a command)
 * @param {string} text - Transcribed text
 * @returns {boolean} True if text is primarily a command
 */
export const isVoiceCommand = (text) => {
  const normalized = normalizeText(text);
  const command = detectVoiceCommand(text);

  if (!command) {
    return false;
  }

  // If the normalized text is very short or matches a command pattern closely,
  // it's likely a command rather than a message
  const words = normalized.split(' ');
  return words.length <= 3; // Commands are typically 1-3 words
};

/**
 * Get all available voice commands for help/display
 * @returns {Array} Array of command objects with name, patterns, and description
 */
export const getAvailableCommands = () => {
  return Object.entries(COMMAND_PATTERNS).map(([name, command]) => ({
    name,
    action: command.action,
    patterns: command.patterns,
    description: getCommandDescription(command.action),
  }));
};

/**
 * Get human-readable description for a command
 * @param {string} action - Command action
 * @returns {string} Description
 */
const getCommandDescription = (action) => {
  const descriptions = {
    stop: 'Stop the current voice conversation',
    pause: 'Pause text-to-speech playback',
    resume: 'Resume paused text-to-speech playback',
    repeat: 'Repeat the last AI response',
    slower: 'Reduce text-to-speech speed',
    faster: 'Increase text-to-speech speed',
    louder: 'Increase text-to-speech volume',
    quieter: 'Decrease text-to-speech volume',
  };
  return descriptions[action] || 'Voice command';
};

export default {
  detectVoiceCommand,
  isVoiceCommand,
  getAvailableCommands,
};
