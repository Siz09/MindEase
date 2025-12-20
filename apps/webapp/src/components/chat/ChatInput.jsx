import { useTranslation } from 'react-i18next';

const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  onToggleVoiceConversation,
  showVoiceConversationToggle = false,
  voiceConversationActive = false,
}) => {
  const { t } = useTranslation();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend?.();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        {showVoiceConversationToggle && (
          <button
            type="button"
            className={`voice-conversation-toggle ${voiceConversationActive ? 'active' : ''}`}
            onClick={() => onToggleVoiceConversation?.()}
            aria-pressed={voiceConversationActive}
            title={
              voiceConversationActive
                ? t('chat.stopVoiceConversation')
                : t('chat.startVoiceConversation')
            }
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
        )}

        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          className="chat-input"
          rows={1}
          disabled={disabled}
        />

        <button
          type="button"
          className={`send-button ${value?.trim() ? 'active' : ''}`}
          onClick={() => onSend?.()}
          disabled={disabled || !value?.trim()}
          aria-label={t('chat.sendMessage')}
          title={t('chat.sendMessage')}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M2 10l16-8-8 8 8 8-16-8z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
