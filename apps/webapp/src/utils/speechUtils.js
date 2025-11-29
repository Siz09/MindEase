export const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => {
  return getSpeechRecognition() !== null;
};

export const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const mapI18nToSpeechLang = (i18nLang) => {
  const langMap = {
    en: 'en-US',
    ne: 'ne-NP',
  };

  const baseLang = i18nLang?.split('-')[0]?.toLowerCase();
  return langMap[baseLang] || 'en-US';
};

export const mapSpeechLangToI18n = (speechLang) => {
  const langMap = {
    'en-US': 'en',
    'ne-NP': 'ne',
  };
  return langMap[speechLang] || 'en';
};

export const loadVoices = (callback) => {
  if (!isSpeechSynthesisSupported()) {
    callback([]);
    return;
  }

  let voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    callback(voices);
  } else {
    const handler = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = null; // Clean up handler
      callback(voices);
    };
    window.speechSynthesis.onvoiceschanged = handler;
  }
};

export const filterVoicesByLang = (voices, langCode) => {
  if (!voices || voices.length === 0) return [];
  if (!langCode) return [];

  const baseLang = langCode.split('-')[0].toLowerCase();

  return voices.filter((voice) => {
    const voiceLang = voice.lang.toLowerCase();
    return voiceLang.startsWith(baseLang) || voiceLang.includes(baseLang);
  });
};

export const getSpeechErrorMessage = (error, t) => {
  const errorMap = {
    'not-allowed': t('chat.microphoneDenied'),
    'no-speech': t('chat.noSpeechDetected'),
    'audio-capture': t('chat.microphoneNotFound'),
    network: t('chat.networkError'),
    aborted: t('chat.recordingCancelled'),
    'service-not-allowed': t('chat.serviceNotAllowed'),
  };

  const errorType = error?.error || error?.type || 'unknown';
  return errorMap[errorType] || t('chat.transcriptionError');
};

export const requestMicrophonePermission = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: false, error: 'not-supported' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      error: error.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture',
    };
  }
};

/**
 * Split text into TTS-safe chunks to avoid browser limits (~32KB)
 * Attempts to split at sentence boundaries when possible
 * @param {string} text - The text to split
 * @param {number} maxChunkSize - Maximum characters per chunk (default: 3000)
 * @returns {string[]} Array of text chunks
 */
export const splitTextForTTS = (text, maxChunkSize = 3000) => {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  let remaining = text;

  while (remaining.length > maxChunkSize) {
    // Try to split at sentence boundary (., !, ?)
    const chunk = remaining.substring(0, maxChunkSize);
    const lastSentenceEnd = Math.max(
      chunk.lastIndexOf('. '),
      chunk.lastIndexOf('! '),
      chunk.lastIndexOf('? ')
    );

    if (lastSentenceEnd > maxChunkSize * 0.5) {
      // Found a sentence boundary in the second half, split there
      chunks.push(remaining.substring(0, lastSentenceEnd + 1).trim());
      remaining = remaining.substring(lastSentenceEnd + 1).trim();
    } else {
      // No good sentence boundary, split at word boundary
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > maxChunkSize * 0.5) {
        chunks.push(remaining.substring(0, lastSpace).trim());
        remaining = remaining.substring(lastSpace).trim();
      } else {
        // Fallback: hard split
        chunks.push(remaining.substring(0, maxChunkSize).trim());
        remaining = remaining.substring(maxChunkSize).trim();
      }
    }
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks.filter((chunk) => chunk.length > 0);
};
