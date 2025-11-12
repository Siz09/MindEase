'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import EmojiPicker from './EmojiPicker';
import '../styles/components/JournalForm.css';

const JournalForm = ({ onSubmit, loading, aiAvailable, isOffline, currentMood, onUpdateMood }) => {
  const { t } = useTranslation();
  const [newEntry, setNewEntry] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contrastDismissed, setContrastDismissed] = useState(false);
  const [updateMoodRequested, setUpdateMoodRequested] = useState(false);
  const [scaleHighlight, setScaleHighlight] = useState(false);
  const [pendingMoodValue, setPendingMoodValue] = useState(null);

  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);
  const moodScaleRef = useRef(null);

  // Reuse detailed mood options like MoodInput
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

  const hexToRgbString = (hex) => {
    try {
      const c = (hex || '').replace('#', '');
      const bigint = parseInt(c, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '0, 0, 0';
      return `${r}, ${g}, ${b}`;
    } catch {
      return '0, 0, 0';
    }
  };

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

    // If the user chose "Update mood" but hasn't picked a new mood yet, block save and guide them
    if (updateMoodRequested && pendingMoodValue == null) {
      toast.info(
        t('journal.contrast.updateRequired') || 'Please update your mood first or choose Keep mood.'
      );
      setScaleHighlight(true);
      if (moodScaleRef.current)
        moodScaleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setScaleHighlight(false), 1200);
      return;
    }

    onSubmit(`${selectedEmoji} ${newEntry}`);
    setNewEntry('');
    setSelectedEmoji('😊');
    setContrastDismissed(false);
    setPendingMoodValue(null);
    setUpdateMoodRequested(false);
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
    // Guide the user to explicitly select a new mood from the scale
    setUpdateMoodRequested(true);
    setContrastDismissed(false);
    setScaleHighlight(true);
    if (moodScaleRef.current)
      moodScaleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setScaleHighlight(false), 1200);
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

          {/* Mood scale (same options as MoodInput detailed) */}
          <div
            className={`mood-scale ${scaleHighlight ? 'scale-highlight' : ''}`}
            ref={moodScaleRef}
            aria-label={t('mood.rateYourMood')}
          >
            <h3>{t('mood.rateYourMood')}</h3>
            <div className="mood-scale-options">
              {detailedMoods.map((mood) => {
                const selected = (pendingMoodValue ?? currentMood?.value) === mood.value;
                return (
                  <button
                    key={mood.value}
                    type="button"
                    className={`mood-scale-option ${selected ? 'selected' : ''}`}
                    onClick={() => {
                      setPendingMoodValue(mood.value);
                      setSelectedEmoji(mood.emoji);
                      setUpdateMoodRequested(false);
                      if (onUpdateMood) {
                        onUpdateMood({ value: mood.value, label: mood.label, emoji: mood.emoji });
                      }
                    }}
                    style={{
                      '--mood-color': mood.color,
                      '--mood-color-rgb': hexToRgbString(mood.color),
                    }}
                    aria-label={t('mood.selectMoodWithValue', {
                      mood: mood.label,
                      value: mood.value,
                    })}
                    aria-pressed={selected}
                    title={selected ? t('mood.selectedTooltip', { mood: mood.label }) : undefined}
                  >
                    <div className="mood-emoji">{mood.emoji}</div>
                    <div className="mood-value">{mood.value}</div>
                    <div className="mood-label-tiny">{mood.label}</div>
                    {selected && (
                      <span className="sr-only">{t('common.selected') || 'Selected'}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

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
