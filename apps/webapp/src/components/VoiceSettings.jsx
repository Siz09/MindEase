import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/VoiceSettings.css';

const VoiceSettings = ({
  voiceInputEnabled,
  voiceOutputEnabled,
  availableVoices,
  selectedVoice,
  rate,
  volume,
  onVoiceInputToggle,
  onVoiceOutputToggle,
  onVoiceChange,
  onRateChange,
  onVolumeChange,
  onTestVoice,
  onClose,
}) => {
  const { t } = useTranslation();
  const [localRate, setLocalRate] = useState(rate);
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    setLocalRate(rate);
  }, [rate]);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setLocalRate(newRate);
    onRateChange(newRate);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    onVolumeChange(newVolume);
  };

  return (
    <div className="voice-settings-overlay" onClick={onClose}>
      <div className="voice-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="voice-settings-header">
          <h3>{t('chat.voiceSettings')}</h3>
          <button className="voice-settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="voice-settings-content">
          <div className="voice-settings-section">
            <div className="voice-settings-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={voiceInputEnabled}
                  onChange={(e) => onVoiceInputToggle(e.target.checked)}
                />
                <span>{t('chat.enableVoiceInput')}</span>
              </label>
            </div>
          </div>

          <div className="voice-settings-section">
            <div className="voice-settings-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={voiceOutputEnabled}
                  onChange={(e) => onVoiceOutputToggle(e.target.checked)}
                />
                <span>{t('chat.enableVoiceOutput')}</span>
              </label>
            </div>
          </div>

          {voiceOutputEnabled && (
            <>
              <div className="voice-settings-section">
                <label className="voice-settings-label">{t('chat.selectVoice')}</label>
                <select
                  className="voice-settings-select"
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find((v) => v.name === e.target.value);
                    if (voice) onVoiceChange(voice);
                  }}
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="voice-settings-section">
                <label className="voice-settings-label">
                  {t('chat.speechRate')}: {localRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  className="voice-settings-slider"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={localRate}
                  onChange={handleRateChange}
                />
                <div className="voice-settings-range-labels">
                  <span>0.5x</span>
                  <span>2.0x</span>
                </div>
              </div>

              <div className="voice-settings-section">
                <label className="voice-settings-label">
                  {t('chat.volume')}: {Math.round(localVolume * 100)}%
                </label>
                <input
                  type="range"
                  className="voice-settings-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localVolume}
                  onChange={handleVolumeChange}
                />
                <div className="voice-settings-range-labels">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="voice-settings-section">
                <button className="voice-settings-test-btn" onClick={onTestVoice}>
                  {t('chat.testVoice')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;
