import { useTranslation } from 'react-i18next';

const InsightsDailySummariesCard = ({ dailySummaries, summaryLoading, language }) => {
  const { t, i18n } = useTranslation();
  const resolvedLanguage = language || i18n.language || 'en-US';

  return (
    <div className="card daily-summaries-section">
      <div className="card-header">
        <div className="section-header-wrapper">
          <div className="section-icon-badge">📅</div>
          <div>
            <h3 className="card-title">{t('insights.yesterdaysSummary') || "Yesterday's Summary"}</h3>
          </div>
        </div>
      </div>

      {summaryLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('insights.generatingSummary') || 'Generating summary...'}</p>
        </div>
      ) : !dailySummaries || dailySummaries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3 className="empty-title">{t('insights.noDailySummaries') || 'No daily summaries yet'}</h3>
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
                  <span className="date-label">
                    {(() => {
                      const [y, m, d] = day.dateKey.split('-').map(Number);
                      return new Date(y, m - 1, d).toLocaleDateString(resolvedLanguage, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      });
                    })()}
                  </span>
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

