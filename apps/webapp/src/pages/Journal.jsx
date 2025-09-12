'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ChatBot from '../components/ChatBot';
import '../styles/Journal.css';

const Journal = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [showChatBot, setShowChatBot] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const journalPrompts = [
    t('journal.prompt1'),
    t('journal.prompt2'),
    t('journal.prompt3'),
    t('journal.prompt4'),
    t('journal.prompt5'),
  ];

  const selectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setCurrentEntry(prompt + '\n\n');
  };

  useEffect(() => {
    // Load journal entries from localStorage
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  const saveEntry = () => {
    if (!currentEntry.trim()) return;

    const entry = {
      id: editingId || Date.now(),
      content: currentEntry,
      date: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
      prompt: selectedPrompt,
    };

    let updatedEntries;
    if (isEditing) {
      updatedEntries = entries.map((e) => (e.id === editingId ? entry : e));
    } else {
      updatedEntries = [entry, ...entries];
    }

    setEntries(updatedEntries);
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

    // Reset form
    setCurrentEntry('');
    setSelectedPrompt('');
    setIsEditing(false);
    setEditingId(null);
  };

  const editEntry = (entry) => {
    setCurrentEntry(entry.content);
    setSelectedPrompt(entry.prompt || '');
    setIsEditing(true);
    setEditingId(entry.id);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteEntry = (id) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
  };

  const cancelEdit = () => {
    setCurrentEntry('');
    setSelectedPrompt('');
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="page journal-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('journal.title')}</h1>
          <p className="page-subtitle">{t('journal.subtitle')}</p>
        </div>

        <div className="journal-content">
          {/* Writing Section */}
          <div className="journal-editor-section">
            <div className="card editor-card">
              <div className="card-header">
                <h2 className="card-title">
                  {isEditing ? t('journal.editEntry') : t('journal.newEntry')}
                </h2>
                <p className="card-description">
                  {isEditing ? t('journal.editDescription') : t('journal.writeDescription')}
                </p>
              </div>

              {/* Journal Prompts */}
              <div className="prompts-section">
                <h3 className="prompts-title">{t('journal.prompts')}</h3>
                <div className="prompts-grid">
                  {journalPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className={`prompt-btn ${selectedPrompt === prompt ? 'selected' : ''}`}
                      onClick={() => selectPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Editor */}
              <div className="editor-container">
                <textarea
                  value={currentEntry}
                  onChange={(e) => setCurrentEntry(e.target.value)}
                  placeholder={t('journal.placeholder')}
                  className="journal-textarea"
                  rows="8"
                />
                <div className="editor-footer">
                  <div className="word-count">
                    {
                      currentEntry
                        .trim()
                        .split(/\s+/)
                        .filter((word) => word.length > 0).length
                    }{' '}
                    {t('journal.words')}
                  </div>
                  <div className="editor-actions">
                    {isEditing && (
                      <button className="btn btn-outline" onClick={cancelEdit}>
                        {t('journal.cancel')}
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={saveEntry}
                      disabled={!currentEntry.trim()}
                    >
                      {isEditing ? t('journal.updateEntry') : t('journal.saveEntry')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Entries History */}
          <div className="journal-history-section">
            {entries.length > 0 ? (
              <div className="entries-container">
                <div className="section-header">
                  <h2 className="section-title">{t('journal.yourEntries')}</h2>
                  <span className="entries-count">
                    {entries.length} {t('journal.entries')}
                  </span>
                </div>

                <div className="entries-grid">
                  {entries.map((entry) => (
                    <div key={entry.id} className="card entry-card">
                      <div className="entry-header">
                        <div className="entry-date">
                          {new Date(entry.date).toLocaleDateString([], {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="entry-actions">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => editEntry(entry)}
                            aria-label={t('journal.editEntry')}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M12.146 1.146a.5.5 0 01.708 0l2 2a.5.5 0 010 .708L6.707 12H4v-2.707l8.146-8.147z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => deleteEntry(entry.id)}
                            aria-label={t('journal.deleteEntry')}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"
                                fill="currentColor"
                              />
                              <path
                                fillRule="evenodd"
                                d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {entry.prompt && (
                        <div className="entry-prompt">
                          <strong>{t('journal.prompt')}:</strong> {entry.prompt}
                        </div>
                      )}

                      <div className="entry-content">
                        {entry.content.length > 200
                          ? `${entry.content.substring(0, 200)}...`
                          : entry.content}
                      </div>

                      <div className="entry-footer">
                        <span className="entry-time">{entry.timestamp}</span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowChatBot(true)}
                        >
                          {t('journal.reflect')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path
                      d="M16 8h32a4 4 0 014 4v40a4 4 0 01-4 4H16a4 4 0 01-4-4V12a4 4 0 014-4z"
                      stroke="var(--gray-300)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M24 20h16M24 28h16M24 36h12"
                      stroke="var(--gray-300)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 className="empty-title">{t('journal.noEntries')}</h3>
                <p className="empty-description">{t('journal.noEntriesDescription')}</p>
              </div>
            )}
          </div>
        </div>

        {/* ChatBot Integration */}
        {showChatBot && <ChatBot />}
      </div>
    </div>
  );
};

export default Journal;
