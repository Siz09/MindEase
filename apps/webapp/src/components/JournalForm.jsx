'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import '../styles/components/JournalForm.css';

const JournalForm = ({ onSubmit, loading, aiAvailable, isOffline, currentMood, onUpdateMood }) => {
  const { t } = useTranslation();
  const [newEntry, setNewEntry] = useState('');

  const [contrastDismissed, setContrastDismissed] = useState(false);

  const textareaRef = useRef(null);

  // Map mood value to a representative emoji (for updating shared mood)
  const valueToEmoji = (value) => {
    if (value == null) return '📝';
    if (value <= 2) return '😢';
    if (value <= 4) return '😕';
    if (value === 5) return '😐';
    if (value <= 7) return '😊';
    if (value <= 9) return '😄';
    return '🤩';
  };

  // No local mood selection UI in journal form

  // No emoji picker

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newEntry.trim()) {
      return;
    }
    if (newEntry.length > 1000) {
      return;
    }

    onSubmit(newEntry);
    setNewEntry('');
    setContrastDismissed(false);
  };

  // No emoji state to initialize

  // Simple categorization helpers for contrast detection
  const categorizeMoodValue = (value) => {
    if (value == null) return null;
    if (value <= 3) return 'negative';
    if (value >= 8) return 'positive';
    return 'neutral';
  };

  // Removed emoji-based categorization

  const getTextSentiment = (text) => {
    const s = (text || '').toLowerCase();
    if (!s.trim()) return null;
    const positives = [
      'happy',
      'great',
      'good',
      'excited',
      'joy',
      'lovely',
      'grateful',
      'amazing',
      'proud',
      'calm',
      'content',
    ];
    const negatives = [
      'sad',
      'down',
      'bad',
      'angry',
      'upset',
      'anxious',
      'worried',
      'stressed',
      'depressed',
      'terrible',
      'awful',
      'cry',
      'low',
    ];
    const posHit = positives.some((w) => s.includes(w));
    const negHit = negatives.some((w) => s.includes(w));
    if (posHit && !negHit) return 'positive';
    if (negHit && !posHit) return 'negative';
    return null;
  };

  const currentCategory = categorizeMoodValue(currentMood?.value);
  const textSentiment = getTextSentiment(newEntry);

  const hasStrongContrast =
    (currentCategory === 'positive' && textSentiment === 'negative') ||
    (currentCategory === 'negative' && textSentiment === 'positive');

  const shouldShowContrast =
    !!currentCategory && currentCategory !== 'neutral' && hasStrongContrast && !contrastDismissed;

  const handleUpdateMoodFromJournal = () => {
    if (!onUpdateMood) return;
    // Update current mood automatically from text sentiment (fallback neutral)
    let value = 5;
    let label = t('mood.neutral');
    if (textSentiment === 'positive') {
      value = 8;
      label = t('mood.good');
    } else if (textSentiment === 'negative') {
      value = 2;
      label = t('mood.low');
    }
    onUpdateMood({ value, label, emoji: valueToEmoji(value) });
    setContrastDismissed(true);
  };

  return (
    <div className="journal-form-component">
      <form onSubmit={handleSubmit} className="journal-form">
        <div className="form-group">
          <label htmlFor="journal-entry" className="form-label">
            {t('journal.newEntry')}
          </label>

          {isOffline && (
            <div className="offline-banner">
              {t('journal.aiUnavailableOffline') || 'AI summaries are disabled while offline.'}
            </div>
          )}

          {/* Mood selection removed from journal form */}

          {/* Entry Textarea */}
          <textarea
            id="journal-entry"
            ref={textareaRef}
            className="journal-textarea"
            placeholder={t('journal.placeholder')}
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            rows={6}
            maxLength={1000}
          />

          {/* Mood scale removed from journal form */}

          {/* Mood/Journal contrast notice (non-blocking) */}
          {shouldShowContrast && (
            <div className="contrast-notice" role="status">
              <div className="contrast-text">
                {textSentiment === 'positive'
                  ? t('journal.contrast.noticePositive', { mood: currentMood?.label || '' }) ||
                    `Your entry feels positive, but mood is set to ${currentMood?.label || ''}.`
                  : t('journal.contrast.noticeNegative', { mood: currentMood?.label || '' }) ||
                    `Your entry feels negative, but mood is set to ${currentMood?.label || ''}.`}
              </div>
              <div className="contrast-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setContrastDismissed(true)}
                >
                  {t('journal.contrast.keep') || 'Keep mood'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateMoodFromJournal}
                >
                  {t('journal.contrast.update') || 'Update mood'}
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <div className="char-count">{newEntry.length} / 1000</div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !newEntry.trim()}
            >
              {loading ? t('journal.saving') : t('journal.saveEntry')}
            </button>
          </div>

          {aiAvailable && (
            <div className="ai-info">
              <p>{t('journal.aiInfo')}</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default JournalForm;
