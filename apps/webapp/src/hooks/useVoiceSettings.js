import { useCallback, useEffect, useState } from 'react';
import { loadVoiceSettings, saveVoiceSettings } from '../utils/voiceSettingsManager';

const FALLBACK_SETTINGS = {
  voiceInputEnabled: false,
  voiceOutputEnabled: false,
  speechRate: 1.0,
  volume: 1.0,
  selectedVoice: null,
};

export const useVoiceSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      return loadVoiceSettings();
    } catch (error) {
      console.error('Failed to load voice settings:', error);
      return FALLBACK_SETTINGS;
    }
  });

  const refresh = useCallback(() => {
    try {
      setSettings(loadVoiceSettings());
    } catch (error) {
      console.error('Failed to refresh voice settings:', error);
      setSettings(FALLBACK_SETTINGS);
    }
  }, []);

  useEffect(() => {
    const onSettingsChanged = () => refresh();
    window.addEventListener('voiceSettingsChanged', onSettingsChanged);
    return () => window.removeEventListener('voiceSettingsChanged', onSettingsChanged);
  }, [refresh]);

  const update = useCallback((partial) => {
    try {
      const saved = saveVoiceSettings(partial);
      if (saved === false) {
        console.error('Failed to save voice settings:', partial);
        return;
      }
      setSettings((prev) => ({ ...prev, ...partial }));
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }, []);

  return {
    settings,
    refresh,
    voiceInputEnabled: Boolean(settings.voiceInputEnabled),
    voiceOutputEnabled: Boolean(settings.voiceOutputEnabled),
    speechRate: settings.speechRate ?? 1.0,
    volume: settings.volume ?? 1.0,
    selectedVoiceName: settings.selectedVoice ?? null,
    setVoiceInputEnabled: (enabled) => update({ voiceInputEnabled: enabled }),
    setVoiceOutputEnabled: (enabled) => update({ voiceOutputEnabled: enabled }),
    setSpeechRate: (speechRate) => update({ speechRate }),
    setVolume: (volume) => update({ volume }),
    setSelectedVoiceName: (selectedVoice) => update({ selectedVoice }),
  };
};
