import { useTranslation } from 'react-i18next';

const TypingIndicator = () => {
  const { t } = useTranslation();

  return (
    <div className="message bot-message typing-message" aria-live="polite" aria-atomic="true">
      <div className="message-avatar" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="var(--primary-green)" opacity="0.15" />
          <path
            d="M6 11s1.5 2 4 2 4-2 4-2M7 7h.01M13 7h.01"
            stroke="var(--primary-green)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="message-content">
        <div className="message-bubble typing-bubble">
          <div className="typing-indicator" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="message-meta">
          <span className="message-time">{t('chat.typing')}</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

