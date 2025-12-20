import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useTextToSpeech from './useTextToSpeech';
import useVoiceRecorder from './useVoiceRecorder';
import { detectVoiceCommand, isVoiceCommand } from '../utils/voiceCommands';
import { loadVoiceSettings } from '../utils/voiceSettingsManager';
import { splitTextForTTS } from '../utils/speechUtils';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const useVoiceConversation = ({
  language = 'en-US',
  voiceConversationEnabled = false,
  onSendText,
} = {}) => {
  const { t } = useTranslation();

  const [settings, setSettings] = useState(() => loadVoiceSettings());
  const [isVoiceConversationActive, setIsVoiceConversationActive] = useState(false);
  const isVoiceConversationActiveRef = useRef(false);
  const [voiceError, setVoiceError] = useState(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const lastBotMessageRef = useRef('');
  const lastSpokenBotIdRef = useRef(null);
  const autoPausedForHiddenTabRef = useRef(false);

  const tts = useTextToSpeech({
    language,
    defaultRate: settings.speechRate ?? 1.0,
    defaultVolume: settings.volume ?? 1.0,
  });

  useEffect(() => {
    if (typeof settings.speechRate === 'number') tts.setRate(settings.speechRate);
    if (typeof settings.volume === 'number') tts.setVolume(settings.volume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.speechRate, settings.volume]);

  const voiceInputEnabled = Boolean(settings.voiceInputEnabled);
  const voiceOutputEnabled = Boolean(settings.voiceOutputEnabled);

  const canUseVoiceConversation = useMemo(() => {
    return voiceConversationEnabled && voiceInputEnabled && voiceOutputEnabled;
  }, [voiceConversationEnabled, voiceInputEnabled, voiceOutputEnabled]);

  const speakText = useCallback(
    (text) => {
      if (!voiceOutputEnabled) return;
      const chunks = splitTextForTTS(text, 2500);
      if (chunks.length === 0) return;
      tts.stop();
      tts.speak(chunks[0]);
      for (const chunk of chunks.slice(1)) tts.addToQueue(chunk);
    },
    [tts, voiceOutputEnabled]
  );

  const handleVoiceCommand = useCallback(
    (command, { stopConversation } = {}) => {
      switch (command) {
        case 'stop':
          stopConversation?.();
          return true;
        case 'pause':
          tts.pause();
          toast.info(t('chat.ttsPaused'));
          return true;
        case 'resume':
          tts.resume();
          toast.info(t('chat.ttsResumed'));
          return true;
        case 'repeat':
          if (!lastBotMessageRef.current) {
            toast.info(t('chat.noMessageToRepeat'));
            return true;
          }
          toast.info(t('chat.repeating'));
          speakText(lastBotMessageRef.current);
          return true;
        case 'slower': {
          const next = clamp((tts.rate ?? 1.0) - 0.1, 0.5, 2.0);
          tts.setRate(next);
          toast.info(t('chat.speedReduced'));
          return true;
        }
        case 'faster': {
          const next = clamp((tts.rate ?? 1.0) + 0.1, 0.5, 2.0);
          tts.setRate(next);
          toast.info(t('chat.speedIncreased'));
          return true;
        }
        case 'louder': {
          const next = clamp((tts.volume ?? 1.0) + 0.1, 0, 1);
          tts.setVolume(next);
          toast.info(t('chat.volumeIncreased'));
          return true;
        }
        case 'quieter': {
          const next = clamp((tts.volume ?? 1.0) - 0.1, 0, 1);
          tts.setVolume(next);
          toast.info(t('chat.volumeDecreased'));
          return true;
        }
        default:
          return false;
      }
    },
    [speakText, tts, t]
  );

  const stopVoiceConversationRef = useRef(() => {});

  const voiceRecorder = useVoiceRecorder({
    language,
    continuous: false,
    interimResults: true,
    onError: (err) => {
      setVoiceError(err);
      setConsecutiveFailures((n) => n + 1);
    },
    onTranscriptionComplete: async (text) => {
      setVoiceError(null);
      setConsecutiveFailures(0);

      const cmd = detectVoiceCommand(text);
      if (cmd && isVoiceCommand(text)) {
        handleVoiceCommand(cmd, { stopConversation: stopVoiceConversationRef.current });
        return;
      }

      if (typeof onSendText === 'function') {
        await onSendText(text);
      }

      if (isVoiceConversationActiveRef.current) {
        voiceRecorder.startRecording();
      }
    },
  });

  const startVoiceConversation = useCallback(() => {
    if (!canUseVoiceConversation) {
      toast.info(t('chat.enableVoiceInSettings'));
      return;
    }
    if (!voiceRecorder.isSupported) {
      toast.error(t('chat.voiceNotSupported'));
      return;
    }

    isVoiceConversationActiveRef.current = true;
    setIsVoiceConversationActive(true);
    autoPausedForHiddenTabRef.current = false;
    setVoiceError(null);
    setConsecutiveFailures(0);
    toast.success(t('chat.voiceConversationStarted'));
    voiceRecorder.startRecording();
  }, [canUseVoiceConversation, t, voiceRecorder]);

  const stopVoiceConversation = useCallback(() => {
    isVoiceConversationActiveRef.current = false;
    setIsVoiceConversationActive(false);
    try {
      voiceRecorder.cancelRecording();
    } catch {
      // ignore
    }
    tts.stop();
    toast.info(t('chat.voiceConversationStopped'));
  }, [tts, voiceRecorder, t]);

  useEffect(() => {
    stopVoiceConversationRef.current = stopVoiceConversation;
  }, [stopVoiceConversation]);

  const toggleVoiceConversation = useCallback(() => {
    if (isVoiceConversationActive) stopVoiceConversation();
    else startVoiceConversation();
  }, [isVoiceConversationActive, startVoiceConversation, stopVoiceConversation]);

  const registerBotMessage = useCallback(
    ({ id, text }) => {
      if (!text) return;
      lastBotMessageRef.current = text;
      if (id && lastSpokenBotIdRef.current === id) return;

      if (isVoiceConversationActiveRef.current && voiceOutputEnabled) {
        lastSpokenBotIdRef.current = id ?? null;
        speakText(text);
      }
    },
    [voiceOutputEnabled, speakText]
  );

  useEffect(() => {
    const onSettingsChanged = () => setSettings(loadVoiceSettings());
    window.addEventListener('voiceSettingsChanged', onSettingsChanged);
    return () => window.removeEventListener('voiceSettingsChanged', onSettingsChanged);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!isVoiceConversationActive) return;

      if (document.hidden) {
        autoPausedForHiddenTabRef.current = true;
        voiceRecorder.stopRecording();
        if (tts.isPlaying && !tts.isPaused) tts.pause();
        toast.info(t('chat.voicePausedHidden'));
      } else if (autoPausedForHiddenTabRef.current) {
        autoPausedForHiddenTabRef.current = false;
        if (!voiceRecorder.isRecording && !voiceRecorder.isTranscribing) {
          voiceRecorder.startRecording();
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isVoiceConversationActive, t, tts, voiceRecorder]);

  useEffect(() => {
    if (consecutiveFailures >= 3 && isVoiceConversationActive) {
      stopVoiceConversation();
      toast.error(t('chat.voiceRecordingFailed'));
    }
  }, [consecutiveFailures, isVoiceConversationActive, stopVoiceConversation, t]);

  return {
    settings,
    voiceInputEnabled,
    voiceOutputEnabled,
    canUseVoiceConversation,
    isVoiceConversationActive,
    toggleVoiceConversation,
    startVoiceConversation,
    stopVoiceConversation,
    voiceError,
    voiceRecorder,
    tts,
    speakText,
    registerBotMessage,
    handleVoiceCommand,
  };
};
