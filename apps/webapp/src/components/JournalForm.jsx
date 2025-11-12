'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EmojiPicker from './EmojiPicker';
import '../styles/components/JournalForm.css';

const JournalForm = ({ onSubmit, loading, aiAvailable, isOffline, currentMood, onUpdateMood }) => {
  const { t } = useTranslation();
  const [newEntry, setNewEntry] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contrastDismissed, setContrastDismissed] = useState(false);

  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    setContrastDismissed(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newEntry.trim()) {
      return;
    }
    if (newEntry.length > 1000) {
      return;
    }

    onSubmit(`${selectedEmoji} ${newEntry}`);
    setNewEntry('');
    setSelectedEmoji('😊');
    setContrastDismissed(false);
  };

  // Initialize selected emoji from currentMood if available
  useEffect(() => {
    if (currentMood?.emoji && selectedEmoji === '😊') {
      setSelectedEmoji(currentMood.emoji);
    }
  }, [currentMood]);

  // Simple categorization helpers for contrast detection
  const categorizeMoodValue = (value) => {
    if (value == null) return null;
    if (value <= 3) return 'negative';
    if (value >= 8) return 'positive';
    return 'neutral';
  };

  const positiveEmojis = new Set([
    '🙂',
    '😊',
    '😄',
    '😁',
    '🤩',
    '🌞',
    '🌈',
    '⭐',
    '❤️',
    '✨',
    '✅',
    '🎁',
    '😀',
    '😃',
  ]);
  const negativeEmojis = new Set([
    '😭',
    '😢',
    '😔',
    '😕',
    '🙁',
    '😡',
    '😤',
    '😱',
    '🤒',
    '💔',
    '⚠️',
  ]);

  const categorizeEmoji = (emoji) => {
    if (positiveEmojis.has(emoji)) return 'positive';
    if (negativeEmojis.has(emoji)) return 'negative';
    return 'neutral';
  };

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
  const emojiCategory = categorizeEmoji(selectedEmoji);
  const textSentiment = getTextSentiment(newEntry);

  const hasStrongContrast =
    (currentCategory === 'positive' &&
      (emojiCategory === 'negative' || textSentiment === 'negative')) ||
    (currentCategory === 'negative' &&
      (emojiCategory === 'positive' || textSentiment === 'positive'));

  const shouldShowContrast =
    !!currentCategory && currentCategory !== 'neutral' && hasStrongContrast && !contrastDismissed;

  const handleUpdateMoodFromJournal = () => {
    if (!onUpdateMood) return;
    const category = emojiCategory !== 'neutral' ? emojiCategory : textSentiment || 'neutral';
    let value = 5;
    let label = t('mood.okay');
    if (category === 'positive') {
      value = 8;
      label = t('mood.good');
    } else if (category === 'negative') {
      value = 2;
      label = t('mood.low');
    }
    onUpdateMood({ value, label, emoji: selectedEmoji });
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

          {/* Emoji Selection */}
          <div className="emoji-section">
            <label className="emoji-label">{t('journal.howAreYouFeeling')}</label>
            <div className="emoji-selector" ref={emojiPickerRef}>
              <button
                type="button"
                className="emoji-trigger"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                aria-label={t('journal.selectEmoji') || 'Select emoji'}
                aria-expanded={showEmojiPicker}
                aria-haspopup="true"
              >
                <span className="selected-emoji">{selectedEmoji}</span>
              </button>
              {showEmojiPicker && (
                <div className="emoji-picker-dropdown">
                  <EmojiPicker onSelect={handleEmojiSelect} />
                </div>
              )}
            </div>
          </div>

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

          {/* Mood/Journal contrast notice (non-blocking) */}
          {shouldShowContrast && (
            <div className="contrast-notice" role="status">
              <div className="contrast-text">
                {textSentiment === 'positive' || emojiCategory === 'positive'
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
