import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import EmojiPicker from './EmojiPicker';

const emojiToMoodValue = (emoji) => {
  const emojiMoodMap = {
    '😭': 1,
    '😢': 2,
    '😔': 3,
    '😕': 4,
    '😐': 5,
    '🙂': 6,
    '😊': 7,
    '😄': 8,
    '😁': 9,
    '🤩': 10,
    '😀': 8,
    '🙁': 4,
    '😡': 2,
    '😤': 3,
    '😱': 2,
    '😴': 5,
    '🤒': 3,
    '🤗': 7,
  };
  return emojiMoodMap[emoji] || null;
};

const JournalEntryComposer = ({ onSubmit, loading, aiAvailable, isOffline }) => {
  const { t } = useTranslation();

  const [newEntry, setNewEntry] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [selectedMoodValue, setSelectedMoodValue] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const emojiPickerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loading) {
      setUploadProgress(0);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    setUploadProgress(20);
    progressTimerRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) return prev;
        return Math.min(95, prev + Math.random() * 10 + 5);
      });
    }, 300);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [loading]);

  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    const moodValue = emojiToMoodValue(emoji);
    if (moodValue) setSelectedMoodValue(moodValue);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newEntry.trim()) {
      toast.info(t('journal.contentRequired'));
      return;
    }
    if (newEntry.length > 1000) {
      toast.error('Entry must be 1000 characters or less');
      return;
    }
    if (!navigator.onLine) {
      toast.info('Offline: AI summary disabled.');
      return;
    }

    const moodValue = selectedMoodValue || emojiToMoodValue(selectedEmoji);
    await onSubmit({
      title: null,
      content: newEntry.trim(),
      moodValue,
    });

    setNewEntry('');
    setSelectedEmoji('😊');
    setSelectedMoodValue(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="journal-form-section">
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

          <div className="emoji-section">
            <label className="emoji-label">{t('journal.howAreYouFeeling')}</label>
            <div className="emoji-selector" ref={emojiPickerRef}>
              <button
                type="button"
                className="emoji-trigger"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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

          <div className="form-actions">
            <div className="char-count">{newEntry.length} / 1000</div>
            <button type="submit" className="btn btn-primary" disabled={loading || !newEntry.trim()}>
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

      {loading && (
        <div className="loader-overlay" role="dialog" aria-live="assertive">
          <div className="loader-card">
            <p className="loader-title">{t('journal.progress.saving')}</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="loader-subtext">{t('journal.progress.analyzing')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntryComposer;

