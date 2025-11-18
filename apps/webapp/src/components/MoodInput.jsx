import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components/MoodInput.css';

const MoodInput = ({ onSubmit, loading, currentMood }) => {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState(null);
  const [quickSelectedId, setQuickSelectedId] = useState(null);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const hexToRgbString = (hex) => {
    try {
      const c = (hex || '').replace('#', '');
      const expanded =
        c.length === 3
          ? c
              .split('')
              .map((x) => x + x)
              .join('')
          : c;
      const bigint = parseInt(expanded, 16);
      if (Number.isNaN(bigint)) return '0, 0, 0';
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r}, ${g}, ${b}`;
    } catch {
      return '0, 0, 0';
    }
  };

  const moods = [
    { id: 1, emoji: '😭', label: t('mood.terrible'), color: '#dc2626', value: 1 },
    { id: 2, emoji: '😢', label: t('mood.low'), color: '#f97316', value: 2 },
    { id: 3, emoji: '😐', label: t('mood.okay'), color: '#eab308', value: 3 },
    { id: 4, emoji: '🙂', label: t('mood.good'), color: '#84cc16', value: 4 },
    { id: 5, emoji: '🤩', label: t('mood.excellent'), color: '#16a34a', value: 5 },
  ];

  const detailedMoods = [
    { value: 1, emoji: '😭', label: t('mood.terrible'), color: '#dc2626' },
    { value: 2, emoji: '😢', label: t('mood.veryBad'), color: '#ea580c' },
    { value: 3, emoji: '😔', label: t('mood.bad'), color: '#f97316' },
    { value: 4, emoji: '😕', label: t('mood.poor'), color: '#fb923c' },
    { value: 5, emoji: '😐', label: t('mood.neutral'), color: '#eab308' },
    { value: 6, emoji: '🙂', label: t('mood.okay'), color: '#a3e635' },
    { value: 7, emoji: '😊', label: t('mood.good'), color: '#84cc16' },
    { value: 8, emoji: '😄', label: t('mood.veryGood'), color: '#65a30d' },
    { value: 9, emoji: '😁', label: t('mood.great'), color: '#16a34a' },
    { value: 10, emoji: '🤩', label: t('mood.amazing'), color: '#15803d' },
  ];

  useEffect(() => {
    if (!showForm || !currentMood) return;
    const preset = detailedMoods.find((m) => m.value === currentMood.value);
    if (preset) {
      setSelectedMood(preset);
    }
  }, [showForm, currentMood]);

  const handleQuickMoodSubmit = async (moodData) => {
    try {
      setQuickSelectedId(moodData.id);
      await onSubmit({
        value: moodData.value * 2,
        emoji: moodData.emoji,
        label: moodData.label,
        notes: null,
      });
    } catch (error) {
      console.error('Failed to submit mood:', error);
    }
  };

  const handleDetailedMoodSubmit = async () => {
    if (!selectedMood) return;
    try {
      await onSubmit({
        value: selectedMood.value,
        emoji: selectedMood.emoji,
        label: selectedMood.label,
        notes: notes.trim() || null,
      });
      setSelectedMood(null);
      setNotes('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to submit mood:', error);
    }
  };

  return (
    <div className="mood-input-component">
      <div className="card mood-entry-card">
        <div className="card-header">
          <h2 className="card-title">{t('mood.howAreYouFeeling')}</h2>
          <p className="card-description">{t('mood.description')}</p>
        </div>

        {!showForm ? (
          <div className="quick-mood-selector">
            <div className="mood-options-quick">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  className={`mood-option-quick ${quickSelectedId === mood.id ? 'selected' : ''}`}
                  onClick={() => handleQuickMoodSubmit(mood)}
                  disabled={loading}
                  style={{
                    '--mood-color': mood.color,
                    '--mood-color-rgb': hexToRgbString(mood.color),
                  }}
                  aria-label={t('mood.selectMoodWithValue', {
                    mood: mood.label,
                    value: mood.value,
                  })}
                  aria-pressed={quickSelectedId === mood.id}
                  title={
                    quickSelectedId === mood.id
                      ? t('mood.selectedTooltip', { mood: mood.label })
                      : undefined
                  }
                >
                  <div className="mood-emoji-large">{mood.emoji}</div>
                  <span className="mood-label-small">{mood.label}</span>
                </button>
              ))}
            </div>
            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                {t('mood.detailedEntry')}
              </button>
            </div>
          </div>
        ) : (
          <div className="detailed-mood-form">
            {currentMood && (
              <div className="selected-mood-preview" aria-live="polite">
                <div className="preview-emoji">{currentMood.emoji || '🙂'}</div>
                <div className="preview-copy">
                  <p className="preview-label">{t('journal.moodBadge') || 'Mood selected'}</p>
                  <p className="preview-value">{currentMood.label || t('mood.howAreYouFeeling')}</p>
                </div>
              </div>
            )}
            <div className="mood-scale">
              <h3>{t('mood.rateYourMood')}</h3>
              <div className="mood-scale-options">
                {detailedMoods.map((mood) => (
                  <button
                    key={mood.value}
                    className={`mood-scale-option ${selectedMood?.value === mood.value ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(mood)}
                    style={{
                      '--mood-color': mood.color,
                      '--mood-color-rgb': hexToRgbString(mood.color),
                    }}
                    aria-label={t('mood.selectMoodWithValue', {
                      mood: mood.label,
                      value: mood.value,
                    })}
                    aria-pressed={selectedMood?.value === mood.value}
                    title={
                      selectedMood?.value === mood.value
                        ? t('mood.selectedTooltip', { mood: mood.label })
                        : undefined
                    }
                  >
                    <div className="mood-emoji">{mood.emoji}</div>
                    <div className="mood-value">{mood.value}</div>
                    <div className="mood-label-tiny">{mood.label}</div>
                    {selectedMood?.value === mood.value && (
                      <span className="sr-only">{t('common.selected') || 'Selected'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mood-notes">
              <label htmlFor="mood-notes" className="form-label">
                {t('mood.notesOptional')}
              </label>
              <textarea
                id="mood-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('mood.notesPlaceholder')}
                className="form-textarea"
                rows="3"
                maxLength="500"
              />
              <div className="character-count">
                {t('mood.characterCount', { current: notes.length, max: 500 })}
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setSelectedMood(null);
                  setNotes('');
                }}
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDetailedMoodSubmit}
                disabled={loading || !selectedMood}
              >
                {loading ? t('common.saving') : t('mood.saveMood')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodInput;
