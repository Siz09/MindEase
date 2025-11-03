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
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [aiStatus, setAiStatus] = useState({ available: false, loading: true });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 🧩 API integration state
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

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

  // 🧩 Load history once on mount with API integration
  useEffect(() => {
    // Initial load handled by fetchJournalEntries
  }, []);

  // Fetch journal entries
  const fetchJournalEntries = useCallback(
    async (page = 0) => {
      try {
        if (!token) {
          console.error('No authentication token available');
          return;
        }
        const response = await fetch(
          `http://localhost:8080/api/journal/history?page=${page}&size=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch journal entries');

        const data = await response.json();
        if (data.success) {
          setEntries(data.entries);
          setCurrentPage(data.currentPage);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        toast.error(t('journal.errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    },
    [token, t]
  );

  // Check AI status
  const checkAIStatus = useCallback(async () => {
    try {
      if (!token) {
        console.error('No authentication token available');
        return;
      }

      // If offline, AI is not available
      if (isOffline) {
        setAiStatus({ available: false, loading: false });
        return;
      }

      const response = await fetch('http://localhost:8080/api/journal/ai-status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAiStatus({ available: data.aiAvailable, loading: false });
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus({ available: false, loading: false });
    }
  }, [token, isOffline]);

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
  };

  // 🧩 Handle form submission with API integration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newEntry.trim()) {
      toast.info('Write something first!');
      return;
    }

    if (!navigator.onLine) {
      toast.info('Offline: AI summary disabled.');
      return;
    }

    setLoading(true);
    setSummary('');

    try {
      const res = await api.post('/journal/add', { content: `${selectedEmoji} ${newEntry}` });
      const data = res.data;

      // 🧩 Handle both ai_summary and aiSummary field mapping
      setSummary(data.ai_summary || data.aiSummary || 'Summary unavailable');
      toast.success('Journal entry added!');
      // Optimistically prepend the new entry
      if (data.entry) {
        setEntries((prev) => [data.entry, ...prev]);
      }
      setNewEntry('');
      setSelectedEmoji('😊');

      // Refresh history with the unified paginated fetch
      await fetchJournalEntries(0);
    } catch (err) {
      console.error(err);
      toast.error('Error saving journal entry');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
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

  // Extract emoji from entry content
  const extractEmoji = (content) => {
    const emojiMatch = content.match(/^(\p{Emoji})\s(.*)/u);
    return emojiMatch
      ? { emoji: emojiMatch[1], text: emojiMatch[2] }
      : { emoji: '📝', text: content };
  };

  // Load data on component mount
  useEffect(() => {
    fetchJournalEntries();
    checkAIStatus();
  }, [fetchJournalEntries, checkAIStatus]);

  // Re-check AI status when online status changes
  useEffect(() => {
    checkAIStatus();
  }, [isOffline, checkAIStatus]);

  // Handle pagination
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

        {/* AI Status Badge */}
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
                    <span className="emoji-dropdown-arrow">▼</span>
                  </button>

                  {showEmojiPicker && (
                    <div className="emoji-picker-container">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </div>
                  )}
                </div>
              </div>

              <textarea
                ref={textareaRef}
                id="journal-entry"
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder={t('journal.placeholder')}
                className="journal-textarea"
                rows="6"
                disabled={loading}
              />
              <div className="character-count">
                {newEntry.length} {t('journal.characters')}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newEntry.trim()}
              className={`btn btn-primary submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  {t('journal.saving')}
                </>
              ) : (
                t('journal.saveEntry')
              )}
            </button>

            {/* AI Info */}
            {aiStatus.available && (
              <div className="ai-info">
                <p>{t('journal.aiInfo')}</p>
              </div>
            )}
          </form>

          {/* 🧩 AI Summary Display */}
          {summary && (
            <div className="summary-card">
              <h3>AI Summary</h3>
              <p>{summary}</p>
            </div>
          )}

          {/* 🧩 Loading Overlay */}
          {loading && (
            <div className="loader-overlay">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>AI is analyzing your entry...</p>
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
              <div className="empty-icon">📝</div>
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
                          <span className="entry-emoji">{emoji}</span>
                          <span className="entry-date">{formatDate(entry.createdAt)}</span>
                        </div>
                      </div>

                      <div className="entry-content">
                        <p>{text}</p>
                      </div>

                      {/* AI Summary Section */}
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

                      {/* Mood Insight Section */}
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

                      {/* AI Processing Indicator */}
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

              {/* Pagination Controls */}
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
