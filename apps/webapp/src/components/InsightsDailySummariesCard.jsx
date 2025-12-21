import { useTranslation } from 'react-i18next';

const formatDateKey = (dateKey, locale) => {
  if (!dateKey || typeof dateKey !== 'string') return 'Invalid date';

  const parts = dateKey.split('-');
  if (parts.length !== 3) return 'Invalid date';

  const [y, m, d] = parts.map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return 'Invalid date';

  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

const InsightsDailySummariesCard = ({ dailySummaries, summaryLoading, language }) => {
  const { t, i18n } = useTranslation();
  const resolvedLanguage = language || i18n.language || 'en-US';

  return (
    <div className="card daily-summaries-section">
      <div className="card-header">
        <div className="section-header-wrapper">
          <div className="section-icon-badge">📅</div>
          <div>
            <h3 className="card-title">
              {t('insights.yesterdaysSummary') || "Yesterday's Summary"}
            </h3>
          </div>
        </div>
      </div>

      {summaryLoading ? (
        <div className="loading-spinner" role="status" aria-live="polite">
          <div className="spinner"></div>
          <p>{t('insights.generatingSummary') || 'Generating summary...'}</p>
        </div>
      ) : !dailySummaries || dailySummaries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            📝
          </div>
          <h3 className="empty-title">
            {t('insights.noDailySummaries') || 'No daily summaries yet'}
          </h3>
          <p className="empty-description">
            {t('insights.summaryProcessing') ||
              'Add journal entries yesterday to see AI summaries here.'}
          </p>
        </div>
      ) : (
        <div className="daily-summaries-list">
          {dailySummaries.map((day) => (
            <div key={day.dateKey} className="daily-summary-card">
              <div className="daily-summary-header">
                <div className="date-info">
                  <span className="date-label">{formatDateKey(day.dateKey, resolvedLanguage)}</span>
                  {day.count && (
                    <span className="entry-count-badge">
                      {t('insights.entryCount', { count: day.count })}
                    </span>
                  )}
                </div>
              </div>
              <div className="daily-summary-content">
                <div className="summary-indicator">✨</div>
                <p className="daily-summary-text">{day.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsDailySummariesCard;
