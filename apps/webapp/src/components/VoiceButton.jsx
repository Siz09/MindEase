import { useTranslation } from 'react-i18next';
import '../styles/VoiceButton.css';

const VoiceButton = ({
  isSupported = true,
  isRecording = false,
  isTranscribing = false,
  error = null,
  onStart = () => {},
  onStop = () => {},
  onCancel = () => {},
  statusText = '',
}) => {
  const { t } = useTranslation();

  if (!isSupported) {
    return (
      <button
        className="voice-button voice-button--disabled"
        disabled
        title={t('chat.voiceNotSupported')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M5 10a5 5 0 0 0 10 0M10 15v3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    );
  }

  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else if (!isTranscribing) {
      onStart();
    }
  };

  const getButtonClass = () => {
    let className = 'voice-button';
    if (isRecording) className += ' voice-button--recording';
    if (isTranscribing) className += ' voice-button--processing';
    if (error) className += ' voice-button--error';
    return className;
  };

  const getStatusText = () => {
    if (error) return error;
    if (statusText) return statusText;
    if (isRecording) return t('chat.listening');
    if (isTranscribing) return t('chat.processing');
    return '';
  };

  return (
    <div className="voice-button-container">
      <button
        className={getButtonClass()}
        onClick={handleClick}
        disabled={isTranscribing}
        title={isRecording ? t('chat.stopRecording') : t('chat.speakNow')}
        type="button"
      >
        {isTranscribing ? (
          <div className="voice-button__spinner">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray="40"
                strokeDashoffset="10"
              />
            </svg>
          </div>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
              stroke="currentColor"
              strokeWidth="2"
              fill={isRecording ? 'currentColor' : 'none'}
            />
            <path
              d="M5 10a5 5 0 0 0 10 0M10 15v3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {isRecording && <span className="voice-button__pulse"></span>}
      </button>
      {getStatusText() && (
        <span className={`voice-button__status ${error ? 'voice-button__status--error' : ''}`}>
          {getStatusText()}
        </span>
      )}
      {isRecording && (
        <button
          className="voice-button__cancel"
          onClick={onCancel}
          title={t('chat.cancelRecording')}
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default VoiceButton;
