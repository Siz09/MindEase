import { useTranslation } from 'react-i18next';
import '../styles/components/MoodStats.css';

const MoodStats = ({ stats, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading || !stats) {
    return (
      <div className="card stats-card">
        <div className="stats-skeleton">{t('mood.loadingStats')}</div>
      </div>
    );
  }

  return (
    <div className="card stats-card">
      <div className="card-header">
        <h3 className="card-title">{t('mood.insights')}</h3>
      </div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.average ?? '—'}</div>
          <div className="stat-label">{t('mood.averageMood')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.total ?? 0}</div>
          <div className="stat-label">{t('mood.entriesLogged')}</div>
        </div>
        <div className="stat-item">
          <div
            className={`stat-value trend-${stats.trend}`}
            aria-label={
              stats.trend === 'up'
                ? t('mood.trendUp')
                : stats.trend === 'down'
                  ? t('mood.trendDown')
                  : t('mood.trendStable')
            }
          >
            {stats.trend === 'up' ? '↗' : stats.trend === 'down' ? '↘' : '→'}
          </div>
          <div className="stat-label">{t('mood.trend')}</div>
        </div>
      </div>
    </div>
  );
};

export default MoodStats;
