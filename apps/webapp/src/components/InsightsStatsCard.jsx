import { useTranslation } from 'react-i18next';

const InsightsStatsCard = ({ journalStats, moodStats }) => {
  const { t } = useTranslation();

  if (!journalStats && !moodStats) return null;

  return (
    <section className="insights-section">
      <div className="card daily-summary-card">
        <div className="card-header">
          <div className="summary-header-top">
            <h3 className="card-title">{t('insights.journalInsights') || 'Journal Insights'}</h3>
          </div>
        </div>

        <div className="combined-stats-grid">
          {journalStats && (
            <>
              <div className="stat-item">
                <div className="stat-value">{journalStats.todayEntries}</div>
                <div className="stat-label">{t('insights.entriesToday') || 'Entries Today'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{journalStats.totalEntries}</div>
                <div className="stat-label">{t('insights.totalEntries') || 'Total Entries'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{journalStats.avgEntriesPerDay}</div>
                <div className="stat-label">{t('insights.avgPerDay') || 'Avg Per Day'}</div>
              </div>
            </>
          )}

          {moodStats && (
            <>
              <div className="stat-item">
                <div className="stat-value">{moodStats.average ?? '—'}</div>
                <div className="stat-label">{t('mood.averageMood') || 'Average Mood'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{moodStats.total ?? 0}</div>
                <div className="stat-label">{t('mood.entriesLogged') || 'Entries Logged'}</div>
              </div>
              <div className="stat-item">
                <div
                  className={`stat-value ${moodStats.trend ? `trend-${moodStats.trend}` : ''}`}
                  aria-label={
                    moodStats.trend === 'up'
                      ? t('mood.trendUp')
                      : moodStats.trend === 'down'
                        ? t('mood.trendDown')
                        : t('mood.trendStable')
                  }
                >
                  {moodStats.trend === 'up' ? '↗' : moodStats.trend === 'down' ? '↘' : '→'}
                </div>
                <div className="stat-label">{t('mood.trend') || 'Trend'}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default InsightsStatsCard;
