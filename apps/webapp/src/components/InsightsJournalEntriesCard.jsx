import { useTranslation } from 'react-i18next';
import { stripLeadingEmoji } from '../hooks/useJournalInsights';

const InsightsJournalEntriesCard = ({
  journalEntries,
  summaryLoading,
  journalPage,
  setJournalPage,
  entriesPerPage,
  totalPages,
  language,
}) => {
  const { t, i18n } = useTranslation();
  const resolvedLanguage = language || i18n.language || 'en-US';

  return (
    <div className="card journal-summary-section">
      <div className="card-header">
        <div className="section-header-wrapper">
          <div className="section-icon-badge">📖</div>
          <div>
            <h3 className="card-title">{t('journal.journalSummary') || 'Journal Summary'}</h3>
          </div>
        </div>
      </div>

      {summaryLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('journal.loading') || 'Loading...'}</p>
        </div>
      ) : !journalEntries || journalEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✍️</div>
          <h3 className="empty-title">{t('journal.noEntries') || 'No entries yet'}</h3>
          <p className="empty-description">
            {t('journal.startWriting') || 'Add a journal entry to see AI insights here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="journal-entries-grid">
            {journalEntries
              .slice(journalPage * entriesPerPage, (journalPage + 1) * entriesPerPage)
              .map((entry, idx) => (
                <div
                  key={entry.id || `${entry.createdAt}-${(entry.content || '').slice(0, 20)}`}
                  className="journal-entry-card"
                >
                  <div className="entry-header">
                    <span className="entry-timestamp">
                      {new Date(entry.createdAt).toLocaleDateString(resolvedLanguage, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="entry-badge">Entry #{journalPage * entriesPerPage + idx + 1}</span>
                  </div>

                  <div className="entry-content-wrapper">
                    <div className="entry-original">
                      <div className="content-label">
                        <span className="label-icon">📝</span>
                        <span>{t('journal.entry') || 'Your Entry'}</span>
                      </div>
                      {entry.content ? (
                        <p className="entry-text">{stripLeadingEmoji(entry.content)}</p>
                      ) : (
                        <p className="entry-text muted">{t('journal.noContent') || 'No content'}</p>
                      )}
                    </div>

                    <div className="entry-summary">
                      <div className="content-label">
                        <span className="label-icon">✨</span>
                        <span>{t('journal.aiInsight') || 'AI Insight'}</span>
                      </div>
                      {entry.aiSummary ? (
                        <p className="summary-text">{entry.aiSummary}</p>
                      ) : (
                        <p className="summary-text muted">
                          {t('journal.noSummary') || 'No AI summary available yet.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {journalEntries.length > entriesPerPage && (
            <div className="pagination-controls">
              <button
                onClick={() => setJournalPage(Math.max(0, journalPage - 1))}
                disabled={journalPage === 0}
                className="pagination-button"
              >
                ← Prev
              </button>
              <span className="pagination-info">
                {t('insights.pageInfo', { current: journalPage + 1, total: totalPages }) ||
                  `Page ${journalPage + 1} of ${totalPages}`}
              </span>
              <button
                onClick={() => setJournalPage(Math.min(totalPages - 1, journalPage + 1))}
                disabled={journalPage >= totalPages - 1}
                className="pagination-button"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InsightsJournalEntriesCard;

