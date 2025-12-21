import { useTranslation } from 'react-i18next';
import Lottie from 'lottie-react';
import { Heart } from 'lucide-react';

const MindfulnessSessionCard = ({
  session,
  isFavorited,
  isCompleted,
  playingAudioId,
  currentAnimationId,
  animationData,
  onToggleFavorite,
  onPlayAudio,
  onPlayAnimation,
}) => {
  const { t } = useTranslation();

  const isPlayingAudio = playingAudioId === session.id;
  const isPlayingAnimation = currentAnimationId === session.id;

  const formatDuration = (minutes) => `${minutes} ${t('mindfulness.minutes')}`;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'audio':
        return '🎵';
      case 'animation':
        return '🎨';
      default:
        return '📱';
    }
  };

  return (
    <div className="session-card" data-session-id={session.id}>
      <div className="session-header">
        <div className="session-type">{getTypeIcon(session.type)}</div>
        <div className="session-header-right">
          {isCompleted && <span className="completion-badge">✓</span>}
          <button
            className="favorite-btn-header"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(session.id);
            }}
          >
            <Heart
              size={18}
              fill={isFavorited ? 'currentColor' : 'none'}
              className={isFavorited ? 'favorited' : ''}
            />
          </button>
          <div
            className="session-difficulty"
            style={{ backgroundColor: getDifficultyColor(session.difficultyLevel) }}
          >
            {session.difficultyLevel}
          </div>
        </div>
      </div>

      <div className="session-content">
        <h3 className="session-title">{session.title}</h3>
        <p className="session-description">{session.description}</p>

        <div className="session-meta">
          <span className="session-duration">⏱️ {formatDuration(session.duration)}</span>
          <span className="session-category">📁 {session.category}</span>
        </div>
      </div>

      <div className="session-actions">
        {session.type === 'audio' ? (
          <button
            onClick={() => onPlayAudio(session)}
            className={`btn ${isPlayingAudio ? 'btn-secondary' : 'btn-primary'} play-btn`}
          >
            {isPlayingAudio ? '⏸️' : '▶️'}
            {isPlayingAudio ? t('mindfulness.stopAudio') : t('mindfulness.playAudio')}
          </button>
        ) : (
          <button
            onClick={() => onPlayAnimation(session)}
            className={`btn ${isPlayingAnimation ? 'btn-secondary' : 'btn-primary'} play-btn`}
          >
            {isPlayingAnimation ? '⏹️' : '🎬'}
            {isPlayingAnimation ? t('mindfulness.stopAnimation') : t('mindfulness.playAnimation')}
          </button>
        )}
      </div>

      {isPlayingAnimation && session.type === 'animation' && (
        <div className="animation-container">
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '200px' }}
            />
          ) : (
            <div className="animation-placeholder">
              <div className="loading-spinner-small"></div>
              <p>{t('mindfulness.loadingAnimation')}</p>
            </div>
          )}
        </div>
      )}

      {isPlayingAudio && session.type === 'audio' && (
        <div className="audio-player">
          <div className="audio-visualizer">
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
            <div className="audio-bar"></div>
          </div>
          <p className="audio-playing-text">{t('mindfulness.audioPlayingHint')}</p>
        </div>
      )}
    </div>
  );
};

export default MindfulnessSessionCard;

