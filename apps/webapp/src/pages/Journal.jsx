import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import EmojiPicker from '../components/EmojiPicker';
import '../styles/Journal.css';

const Journal = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [aiStatus, setAiStatus] = useState({ available: false, loading: true });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Kept state for API flow (no inline summary card rendered anymore)
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const pollingMapRef = useRef(new Map());
  const progressTimerRef = useRef(null);

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

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup any pending polling on unmount
  useEffect(() => {
    return () => {
      if (pollingMapRef.current) {
        for (const id of pollingMapRef.current.values()) {
          clearInterval(id);
        }
        pollingMapRef.current.clear();
      }
    };
  }, []);

  // Fetch journal entries
  const fetchJournalEntries = useCallback(
    async (page = 0) => {
      try {
        setIsLoading(true);
        const res = await api.get(`/journal/history?page=${page}&size=10`);
        const data = res.data || {};
        if (data.success) {
          setEntries(data.entries || []);
          setCurrentPage(data.currentPage || 0);
          setTotalPages(data.totalPages || 0);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        toast.error(t('journal.errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  // Check AI status
  const checkAIStatus = useCallback(async () => {
    try {
      if (isOffline) {
        setAiStatus({ available: false, loading: false });
        return;
      }
      const res = await api.get('/journal/ai-status');
      const data = res.data || {};
      setAiStatus({ available: !!data.aiAvailable, loading: false });
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus({ available: false, loading: false });
    }
  }, [isOffline]);

  // Initial load
  useEffect(() => {
    if (!token) return;
    fetchJournalEntries(0);
    checkAIStatus();
  }, [token, fetchJournalEntries, checkAIStatus]);

  // Re-check AI status when online status changes
  useEffect(() => {
    checkAIStatus();
  }, [isOffline, checkAIStatus]);

  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
  };

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

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  // Submit new entry
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!entryTitle.trim()) {
      toast.info(t('journal.titleRequired'));
      return;
    }
    if (!newEntry.trim()) {
      toast.info('Write something first!');
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

    setLoading(true);

    try {
      const res = await api.post('/journal/add', {
        title: entryTitle.trim(),
        content: `${selectedEmoji} ${newEntry.trim()}`,
      });
      const data = res.data || {};

      const returnedEntry = data.entry || null;
      toast.success('Journal entry added!');

      if (returnedEntry) {
        setEntries((prev) => [returnedEntry, ...prev]);
      }
      setNewEntry('');
      setEntryTitle('');
      setSelectedEmoji('😊');

      // Poll briefly for AI summary completion and refresh the entry in the list
      if (returnedEntry && returnedEntry.id) {
        pollForAICompletion(returnedEntry.id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving journal entry');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const extractEmoji = (content) => {
    if (!content) return { emoji: '📝', text: '' };
    const s = String(content);
    const match = s.match(
      /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/u
    );
    if (match) {
      const rest = s.slice(match[0].length);
      if (rest.startsWith(' ')) {
        return { emoji: match[0], text: rest.slice(1) };
      }
    }
    return { emoji: '📝', text: s };
  };

  const pollForAICompletion = useCallback((entryId) => {
    const maxAttempts = 8;
    const intervalMs = 1500;

    if (pollingMapRef.current) {
      const existing = pollingMapRef.current.get(entryId);
      if (existing) clearInterval(existing);
    }

    let attempts = 0;
    const id = setInterval(async () => {
      attempts += 1;
      const historyRes = await api.get('/journal/history?page=0&size=10').catch(() => null);
      if (historyRes) {
        const payload = historyRes.data || {};
        const list = payload.entries || [];
        const found = list.find((it) => it.id === entryId);
        if (found && (found.aiSummary || found.moodInsight)) {
          setEntries((prev) => {
            const idx = prev.findIndex((it) => it.id === entryId);
            if (idx === -1) return prev;
            const next = prev.slice();
            next[idx] = found;
            return next;
          });
          clearInterval(id);
          pollingMapRef.current.delete(entryId);
          return;
        }
      }
      if (attempts >= maxAttempts) {
        clearInterval(id);
        pollingMapRef.current.delete(entryId);
      }
    }, intervalMs);
    pollingMapRef.current.set(entryId, id);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchJournalEntries(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="journal-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('journal.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-container">
      <div className="journal-header">
        <h1>{t('journal.title')}</h1>
        <p className="journal-subtitle">{t('journal.subtitle')}</p>
        <div className={`ai-status ${aiStatus.available ? 'available' : 'unavailable'}`}>
          <span className="ai-dot"></span>
          {aiStatus.available ? t('journal.aiAvailable') : t('journal.aiUnavailable')}
        </div>
      </div>

      <div className="journal-layout">
        {/* Left Column - New Entry Form */}
        <div className="journal-form-section">
          <form onSubmit={handleSubmit} className="journal-form">
            <div className="form-group">
              <label htmlFor="journal-title" className="form-label">
                {t('journal.entryTitleLabel')}
              </label>
              <input
                id="journal-title"
                type="text"
                className="journal-title-input"
                placeholder={t('journal.entryTitlePlaceholder')}
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                maxLength={150}
                disabled={loading}
              />

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
                  disabled={loading || !entryTitle.trim() || !newEntry.trim()}
                >
                  {loading ? t('journal.saving') : t('journal.saveEntry')}
                </button>
              </div>

              {aiStatus.available && (
                <div className="ai-info">
                  <p>{t('journal.aiInfo')}</p>
                </div>
              )}
            </div>
          </form>

          {/* Loading Overlay */}
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

        {/* Right Column - Journal History */}
        <div className="journal-history-section">
          <div className="history-header">
            <h2>{t('journal.history')}</h2>
            {entries.length > 0 && (
              <div className="pagination-info">
                {t('journal.page')} {currentPage + 1} {t('journal.of')} {totalPages}
                <span className="total-entries">
                  {' '}
                  • {entries.length} {t('journal.entries')}
                </span>
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📔</div>
              <h3>{t('journal.noEntries')}</h3>
              <p>{t('journal.startWriting')}</p>
            </div>
          ) : (
            <>
              <div className="entries-list">
                {entries.map((entry) => {
                  const { emoji, text } = extractEmoji(entry.content);
                  return (
                    <div key={entry.id} className="journal-entry-card">
                      <div className="entry-header">
                        <div className="entry-meta">
                          <span className="entry-emoji" aria-hidden="true">
                            {emoji}
                          </span>
                          <div className="entry-meta-text">
                            <h3 className="entry-title">{entry.title || t('journal.entry')}</h3>
                            <span className="entry-date">{formatDate(entry.createdAt)}</span>
                          </div>
                        </div>
                        {emoji && (
                          <span className="entry-mood-pill">
                            <span className="pill-emoji" aria-hidden="true">
                              {emoji}
                            </span>
                            <span className="pill-label">{t('journal.moodBadge')}</span>
                          </span>
                        )}
                      </div>

                      <div className="entry-content">
                        <p>{text}</p>
                      </div>

                      {entry.aiSummary && (
                        <div className="ai-summary-section">
                          <div className="ai-summary-header">
                            <span className="ai-icon">🤖</span>
                            <strong>{t('journal.aiSummary')}</strong>
                          </div>
                          <div className="ai-summary-content">
                            <p>{entry.aiSummary}</p>
                          </div>
                        </div>
                      )}

                      {entry.moodInsight && (
                        <div className="mood-insight-section">
                          <div className="mood-insight-header">
                            <span className="mood-icon">💡</span>
                            <strong>{t('journal.moodInsight')}</strong>
                          </div>
                          <div className="mood-insight-content">
                            <p>{entry.moodInsight}</p>
                          </div>
                        </div>
                      )}

                      {!entry.aiSummary && !entry.moodInsight && (
                        <div className="ai-processing">
                          <div className="processing-spinner"></div>
                          <span>{t('journal.aiProcessing')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="btn btn-outline pagination-btn"
                  >
                    {t('journal.previous')}
                  </button>

                  <span className="pagination-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage <= 2) {
                        pageNum = i;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="btn btn-outline pagination-btn"
                  >
                    {t('journal.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;
