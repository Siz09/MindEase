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
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      callback(voices);
    };
  }
};

export const filterVoicesByLang = (voices, langCode) => {
  if (!voices || voices.length === 0) return [];

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
