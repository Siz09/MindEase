import { useTranslation } from 'react-i18next';

const MindfulnessQuickStats = ({ sessions }) => {
  const { t } = useTranslation();
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  return (
    <div className="quick-stats">
      <div className="stat-card">
        <div className="stat-number">{safeSessions.length}</div>
        <div className="stat-label">{t('mindfulness.totalSessions')}</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{safeSessions.filter((s) => s?.type === 'audio').length}</div>
        <div className="stat-label">{t('mindfulness.audioSessions')}</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">
          {safeSessions.filter((s) => s?.type === 'animation').length}
        </div>
        <div className="stat-label">{t('mindfulness.animationSessions')}</div>
      </div>
    </div>
  );
};

export default MindfulnessQuickStats;
