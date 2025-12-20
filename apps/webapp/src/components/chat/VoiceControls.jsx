import { useTranslation } from 'react-i18next';
import VoiceButton from '../VoiceButton';

const VoiceControls = ({
  enabled = false,
  active = false,
  isSupported = true,
  isRecording = false,
  isTranscribing = false,
  error = null,
  interimTranscript = '',
  onToggle = () => {},
  onStartRecording = () => {},
  onStopRecording = () => {},
  onCancelRecording = () => {},
}) => {
  const { t } = useTranslation();

  if (!enabled) return null;

  return (
    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--gray-200, #e5e7eb)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          className={`voice-conversation-toggle ${active ? 'active' : ''}`}
          onClick={onToggle}
          aria-pressed={active}
          aria-label={active ? t('chat.stopVoiceConversation') : t('chat.startVoiceConversation')}
          title={active ? t('chat.stopVoiceConversation') : t('chat.startVoiceConversation')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
          </svg>
        </button>

        {active && (
          <VoiceButton
            isSupported={isSupported}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            error={error}
            onStart={onStartRecording}
            onStop={onStopRecording}
            onCancel={onCancelRecording}
          />
        )}
      </div>

      {active && interimTranscript && (
        <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary, #4b5563)' }}>
          {interimTranscript}
        </div>
      )}
    </div>
  );
};

export default VoiceControls;
