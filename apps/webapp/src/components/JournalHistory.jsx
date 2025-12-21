import { useTranslation } from 'react-i18next';
import '../styles/components/JournalHistory.css';

const JournalHistory = ({
  entries = [],
  isLoading,
  currentPage,
  totalPages,
  totalEntries,
  onPageChange,
  showAISections = false,
}) => {
  const { t, i18n } = useTranslation();

  const handlePageChange = (page) => {
    if (typeof onPageChange === 'function') onPageChange(page);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('journal.justNow');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('journal.justNow');
    return new Intl.DateTimeFormat(i18n.language || 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Map mood value (1-10) to emoji
  const moodValueToEmoji = (moodValue) => {
    if (!moodValue || moodValue < 1 || moodValue > 10) return null;
    const moodEmojiMap = {
      1: '😭',
      2: '😢',
      3: '😔',
      4: '😕',
      5: '😐',
      6: '🙂',
      7: '😊',
      8: '😄',
      9: '😁',
      10: '🤩',
    };
    return moodEmojiMap[moodValue] || null;
  };

  const extractEntryParts = (content) => {
    if (!content) return { emoji: '', text: '' };
    const s = String(content);
    // Note: This regex pattern may not match all emoji types (skin tones, flags, keycaps).
    // For production, consider using a dedicated emoji library (e.g., emoji-test-regex-pattern)
    // or upgrading to ES2024 with /v flag for full UTS#51 support.
    const match = s.match(
      /^(?:\p{Extended_Pictographic}(?:\u200d\p{Extended_Pictographic})*(?:\ufe0f)?)+\s?/u
    );
    if (match) {
      const emoji = match[0].trim();
      return { emoji, text: s.slice(match[0].length) };
    }
    return { emoji: '', text: s };
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="journal-history-section">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('journal.loading')}</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="journal-history-section">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>{t('journal.noEntries')}</h3>
          <p>{t('journal.startWriting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-history-section">
      <div className="history-header">
        <h2>{t('journal.history')}</h2>
        {entries.length > 0 && (
          <div className="pagination-info">
            {t('journal.page')} {currentPage + 1} {t('journal.of')} {totalPages}
            <span className="total-entries">
              {' '}
              • {typeof totalEntries === 'number' ? totalEntries : entries.length}{' '}
              {t('journal.entries')}
            </span>
          </div>
        )}
      </div>

      <div className="entries-list">
        {entries.map((entry, idx) => {
          // Get emoji from mood value if available, otherwise try to extract from content
          const moodEmoji = entry.moodValue ? moodValueToEmoji(entry.moodValue) : null;
          const { emoji: contentEmoji, text } = extractEntryParts(entry.content);
          const emoji = moodEmoji || contentEmoji;

          return (
            <div key={entry.id ?? idx} className="journal-entry-card">
              <div className="entry-header">
                <div className="entry-meta">
                  {emoji && (
                    <span className="entry-emoji" aria-hidden="true">
                      {emoji}
                    </span>
                  )}
                  <div className="entry-meta-text">
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
                <p>{text || entry.content}</p>
              </div>

              {showAISections && entry.aiSummary && (
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

              {showAISections && entry.moodInsight && (
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

              {showAISections && !entry.aiSummary && !entry.moodInsight && (
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
    </div>
  );
};

export default JournalHistory;
