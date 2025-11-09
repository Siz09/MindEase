'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EmojiPicker from './EmojiPicker';
import '../styles/components/JournalForm.css';

const JournalForm = ({ onSubmit, loading, aiAvailable, isOffline }) => {
  const { t } = useTranslation();
  const [newEntry, setNewEntry] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
