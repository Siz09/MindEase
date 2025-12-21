import { useTranslation } from 'react-i18next';
import MindfulnessSessionCard from './MindfulnessSessionCard';

const MindfulnessSessionsGrid = ({
  sessions,
  favorites,
  sessionCompletions,
  playingAudioId,
  currentAnimationId,
  animationData,
  onToggleFavorite,
  onPlayAudio,
  onPlayAnimation,
  onShowAllSessions,
}) => {
  const { t } = useTranslation();
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const favoritesSet = favorites instanceof Set ? favorites : new Set();
  const completionsSet = sessionCompletions instanceof Set ? sessionCompletions : new Set();

  return (
    <div className="sessions-grid">
      {safeSessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧘‍♂️</div>
          <h3>{t('mindfulness.noSessionsFound')}</h3>
          <p>{t('mindfulness.tryChangingFilters')}</p>
          <button onClick={onShowAllSessions} className="btn btn-primary">
            {t('mindfulness.showAllSessions')}
          </button>
        </div>
      ) : (
        safeSessions.map((session) => (
          <MindfulnessSessionCard
            key={session.id}
            session={session}
            isFavorited={favoritesSet.has(session.id)}
            isCompleted={completionsSet.has(session.id)}
            playingAudioId={playingAudioId}
            currentAnimationId={currentAnimationId}
            animationData={animationData}
            onToggleFavorite={onToggleFavorite}
            onPlayAudio={onPlayAudio}
            onPlayAnimation={onPlayAnimation}
          />
        ))
      )}
    </div>
  );
};

export default MindfulnessSessionsGrid;

