'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components/JournalForm.css';

const JournalForm = ({ onSubmit, loading, aiAvailable, isOffline, currentMood, onUpdateMood }) => {
  const { t } = useTranslation();
  const [newEntry, setNewEntry] = useState('');

  const [uploadProgress, setUploadProgress] = useState(0);

  const textareaRef = useRef(null);

  // No local mood selection UI in journal form

  // No emoji picker

  useEffect(() => {
    if (!loading) {
      setUploadProgress(0);
      return;
    }
    setUploadProgress(15);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) return prev;
        return Math.min(95, prev + Math.random() * 12);
      });
    }, 320);
    return () => clearInterval(timer);
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newEntry.trim()) {
      return;
    }
    if (newEntry.length > 1000) {
      return;
    }

    onSubmit({
      title: null,
      content: newEntry.trim(),
      moodValue: currentMood ? currentMood.value : null, // Pass mood value if available
    });
    setNewEntry('');
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
    // Basic negation handling: if a negation appears shortly before a sentiment term, skip classification
    const negations = [
      'not',
      'no',
      'never',
      "don't",
      "doesn't",
      "didn't",
      "won't",
      "can't",
      "couldn't",
      "shouldn't",
    ];
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
    const sentiments = [...positives, ...negatives].join('|');
    const negationRegex = new RegExp(
      `\\b(?:${negations.join('|')})\\s+(?:\\w+\\s+){0,2}(?:${sentiments})\\b`,
      'i'
    );
    if (negationRegex.test(s)) return null;
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
    !!currentCategory && currentCategory !== 'neutral' && hasStrongContrast;

  return (
    <div className="journal-form-component">
      <form onSubmit={handleSubmit} className="journal-form">
        <div className="form-group">
          <label htmlFor="journal-entry" className="form-label">
            {t('journal.newEntry')}
          </label>

          {isOffline && (
            <div className="offline-banner">
              {t('journal.aiUnavailableOffline', 'AI summaries are disabled while offline.')}
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

          {/* Mood/Journal contrast notice (informational) */}
          {shouldShowContrast && (
            <div className="contrast-notice" role="status">
              <div className="contrast-text">
                {textSentiment === 'positive'
                  ? t('journal.contrast.noticePositive', { mood: currentMood?.label || '' }) ||
                    `Your entry feels positive, but mood is set to ${currentMood?.label || ''}.`
                  : t('journal.contrast.noticeNegative', { mood: currentMood?.label || '' }) ||
                    `Your entry feels negative, but mood is set to ${currentMood?.label || ''}.`}
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

          {loading && (
            <div className="journal-progress" role="status" aria-live="polite">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="progress-text">{t('journal.progress.saving')}</p>
            </div>
          )}

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
