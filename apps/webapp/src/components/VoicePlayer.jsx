import { useTranslation } from 'react-i18next';
import '../styles/VoicePlayer.css';

const VoicePlayer = ({
  isPlaying = false,
  isPaused = false,
  onPlay = () => {},
  onPause = () => {},
  onStop = () => {},
  compact = false,
}) => {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className="voice-player voice-player--compact">
        {!isPlaying ? (
          <button
            className="voice-player__btn voice-player__btn--play"
            onClick={onPlay}
            title={t('chat.playVoice')}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 3l9 5-9 5V3z" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                className="voice-player__btn voice-player__btn--play"
                onClick={onPlay}
                title={t('chat.playVoice')}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 3l9 5-9 5V3z" fill="currentColor" />
                </svg>
              </button>
            ) : (
              <button
                className="voice-player__btn voice-player__btn--pause"
                onClick={onPause}
                title={t('chat.pauseVoice')}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="4" y="3" width="3" height="10" fill="currentColor" />
                  <rect x="9" y="3" width="3" height="10" fill="currentColor" />
                </svg>
              </button>
            )}
            <button
              className="voice-player__btn voice-player__btn--stop"
              onClick={onStop}
              title={t('chat.stopVoice')}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="4" width="8" height="8" fill="currentColor" />
              </svg>
            </button>
            <div className="voice-player__indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="voice-player">
      <div className="voice-player__controls">
        {!isPlaying ? (
          <button
            className="voice-player__btn voice-player__btn--play"
            onClick={onPlay}
            title={t('chat.playVoice')}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 3l12 7-12 7V3z" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                className="voice-player__btn voice-player__btn--play"
                onClick={onPlay}
                title={t('chat.playVoice')}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 3l12 7-12 7V3z" fill="currentColor" />
                </svg>
              </button>
            ) : (
              <button
                className="voice-player__btn voice-player__btn--pause"
                onClick={onPause}
                title={t('chat.pauseVoice')}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="5" y="3" width="4" height="14" fill="currentColor" />
                  <rect x="11" y="3" width="4" height="14" fill="currentColor" />
                </svg>
              </button>
            )}
            <button
              className="voice-player__btn voice-player__btn--stop"
              onClick={onStop}
              title={t('chat.stopVoice')}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="5" width="10" height="10" fill="currentColor" />
              </svg>
            </button>
          </>
        )}
      </div>
      {isPlaying && !isPaused && (
        <div className="voice-player__indicator voice-player__indicator--large">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
};

export default VoicePlayer;
