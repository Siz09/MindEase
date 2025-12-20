import { useCallback, useEffect, useState } from 'react';
import { loadVoiceSettings, saveVoiceSettings } from '../utils/voiceSettingsManager';

export const useVoiceSettings = () => {
  const [settings, setSettings] = useState(() => loadVoiceSettings());

  const refresh = useCallback(() => {
    setSettings(loadVoiceSettings());
  }, []);

  useEffect(() => {
    const onSettingsChanged = () => refresh();
    window.addEventListener('voiceSettingsChanged', onSettingsChanged);
    return () => window.removeEventListener('voiceSettingsChanged', onSettingsChanged);
  }, [refresh]);

  const update = useCallback((partial) => {
    saveVoiceSettings(partial);
    setSettings((prev) => ({ ...prev, ...partial }));
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

