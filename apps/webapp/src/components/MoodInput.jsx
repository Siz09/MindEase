'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components/MoodInput.css';

const MoodInput = ({ onSubmit, loading }) => {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState(null);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const moods = [
    { id: 1, emoji: '😢', label: t('mood.terrible'), color: '#dc2626', value: 1 },
    { id: 2, emoji: '😔', label: t('mood.low'), color: '#f97316', value: 2 },
    { id: 3, emoji: '😐', label: t('mood.okay'), color: '#eab308', value: 3 },
    { id: 4, emoji: '🙂', label: t('mood.good'), color: '#84cc16', value: 4 },
    { id: 5, emoji: '😊', label: t('mood.excellent'), color: '#16a34a', value: 5 },
  ];

  const detailedMoods = [
    { value: 1, emoji: '😭', label: 'Terrible', color: '#dc2626' },
    { value: 2, emoji: '😢', label: 'Very Bad', color: '#ea580c' },
    { value: 3, emoji: '😔', label: 'Bad', color: '#f97316' },
    { value: 4, emoji: '😕', label: 'Poor', color: '#fb923c' },
    { value: 5, emoji: '😐', label: 'Neutral', color: '#eab308' },
    { value: 6, emoji: '🙂', label: 'Okay', color: '#a3e635' },
    { value: 7, emoji: '😊', label: 'Good', color: '#84cc16' },
    { value: 8, emoji: '😄', label: 'Very Good', color: '#65a30d' },
    { value: 9, emoji: '😁', label: 'Great', color: '#16a34a' },
    { value: 10, emoji: '🤩', label: 'Amazing', color: '#15803d' },
  ];

  const handleQuickMoodSubmit = (moodData) => {
    onSubmit({
      value: moodData.value * 2,
      emoji: moodData.emoji,
      label: moodData.label,
      notes: null,
    });
  };

  const handleDetailedMoodSubmit = () => {
    if (!selectedMood) return;
    onSubmit({
      value: selectedMood.value,
      emoji: selectedMood.emoji,
      label: selectedMood.label,
      notes: notes.trim() || null,
    });
    // Reset form
    setSelectedMood(null);
    setNotes('');
    setShowForm(false);
  };

  return (
    <div className="mood-input-component">
      <div className="card mood-entry-card">
        <div className="card-header">
          <h2 className="card-title">{t('mood.howAreYouFeeling')}</h2>
          <p className="card-description">Track your mood with a quick entry or detailed form</p>
        </div>

        {!showForm ? (
          <div className="quick-mood-selector">
            <div className="mood-options-quick">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  className="mood-option-quick"
                  onClick={() => handleQuickMoodSubmit(mood)}
                  disabled={loading}
                  style={{ '--mood-color': mood.color }}
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
                Detailed Entry
              </button>
            </div>
          </div>
        ) : (
          <div className="detailed-mood-form">
            <div className="mood-scale">
              <h3>Rate your mood (1-10)</h3>
              <div className="mood-scale-options">
                {detailedMoods.map((mood) => (
                  <button
                    key={mood.value}
                    className={`mood-scale-option ${selectedMood?.value === mood.value ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(mood)}
                    style={{ '--mood-color': mood.color }}
                  >
                    <div className="mood-emoji">{mood.emoji}</div>
                    <div className="mood-value">{mood.value}</div>
                    <div className="mood-label-tiny">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mood-notes">
              <label htmlFor="mood-notes" className="form-label">
                Notes (optional)
              </label>
              <textarea
                id="mood-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling? What's on your mind?"
                className="form-textarea"
                rows="3"
                maxLength="500"
              />
              <div className="character-count">{notes.length}/500 characters</div>
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
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDetailedMoodSubmit}
                disabled={loading || !selectedMood}
              >
                {loading ? 'Saving...' : 'Save Mood'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodInput;
