import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import { useVoiceSettings } from '../../hooks/useVoiceSettings';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  mapI18nToSpeechLang,
} from '../../utils/speechUtils';

const VoiceSettingsSection = () => {
  const { t, i18n } = useTranslation();
  const {
    voiceInputEnabled,
    voiceOutputEnabled,
    speechRate,
    volume,
    selectedVoiceName,
    setVoiceInputEnabled,
    setVoiceOutputEnabled,
    setSpeechRate,
    setVolume,
    setSelectedVoiceName,
  } = useVoiceSettings();

  const isVoiceInputSupported = isSpeechRecognitionSupported();
  const isVoiceOutputSupported = isSpeechSynthesisSupported();

  const {
    speak,
    availableVoices,
    selectedVoice,
    setVoice,
    rate,
    setRate,
    setVolume: setTtsVolume,
  } = useTextToSpeech({
    language: mapI18nToSpeechLang(i18n.language),
    defaultRate: speechRate,
    defaultVolume: volume,
  });

  useEffect(() => {
    setRate(speechRate);
    setTtsVolume(volume);
  }, [speechRate, volume, setRate, setTtsVolume]);

  useEffect(() => {
    if (!selectedVoiceName || availableVoices.length === 0) return;
    if (selectedVoice?.name === selectedVoiceName) return;
    const voice = availableVoices.find((v) => v.name === selectedVoiceName);
    if (voice) setVoice(voice);
  }, [selectedVoiceName, availableVoices, selectedVoice, setVoice]);

  const handleVoiceInputToggle = (enabled) => {
    setVoiceInputEnabled(enabled);
    toast.success(enabled ? t('settings.voice.inputEnabled') : t('settings.voice.inputDisabled'));
  };

  const handleVoiceOutputToggle = (enabled) => {
    setVoiceOutputEnabled(enabled);
    toast.success(enabled ? t('settings.voice.outputEnabled') : t('settings.voice.outputDisabled'));
  };

  const handleVoiceChange = (voice) => {
    setVoice(voice);
    setSelectedVoiceName(voice.name);
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    setSpeechRate(newRate);
  };

  const handleVolumeChange = (newVolume) => {
    setTtsVolume(newVolume);
    setVolume(newVolume);
  };

  const handleTestVoice = () => {
    speak(t('chat.testVoiceSample'));
  };

  if (!isVoiceInputSupported && !isVoiceOutputSupported) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{t('settings.voiceSettings')}</h2>
      </div>

      {isVoiceInputSupported && (
        <div className="form-group">
          <label className="form-label toggle-label">
            <div className="toggle-info">
              <span className="toggle-title">{t('chat.enableVoiceInput')}</span>
              <p className="setting-description">{t('settings.voice.inputDescription')}</p>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={voiceInputEnabled}
                onChange={(e) => handleVoiceInputToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>
        </div>
      )}

      {isVoiceOutputSupported && (
        <div className="form-group">
          <label className="form-label toggle-label">
            <div className="toggle-info">
              <span className="toggle-title">{t('chat.enableVoiceOutput')}</span>
              <p className="setting-description">{t('settings.voice.outputDescription')}</p>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={voiceOutputEnabled}
                onChange={(e) => handleVoiceOutputToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>

          {voiceOutputEnabled && (
            <>
              <div className="form-group">
                <label className="form-label">{t('chat.selectVoice')}</label>
                <select
                  className="form-input"
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find((v) => v.name === e.target.value);
                    if (voice) handleVoiceChange(voice);
                  }}
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('chat.speechRate')}: {rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                />
                <div className="range-labels">
                  <span>0.5x</span>
                  <span>2.0x</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('chat.volume')}: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                />
                <div className="range-labels">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <button className="btn btn-secondary" onClick={handleTestVoice}>
                {t('chat.testVoice')}
              </button>
            </>
          )}
        </div>
      )}

      {voiceInputEnabled && voiceOutputEnabled && (
        <div className="voice-conversation-info">
          <p className="setting-description">
            <strong>{t('settings.voice.conversationModeTitle')}:</strong>{' '}
            {t('settings.voice.conversationModeDescription')}
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceSettingsSection;

