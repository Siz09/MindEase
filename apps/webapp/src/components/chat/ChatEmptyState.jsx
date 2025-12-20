import { useTranslation } from 'react-i18next';

const ChatEmptyState = ({ onSelectMessage }) => {
  const { t } = useTranslation();

  const quickResponseKeys = [
    'chat.quickResponses.anxiety',
    'chat.quickResponses.motivation',
    'chat.quickResponses.relax',
    'chat.quickResponses.grateful',
  ];

  const quickResponses = quickResponseKeys.map((key) => t(key));

  return (
    <div className="empty-chat">
      <div className="empty-chat-content">
        <div className="empty-icon" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="24" fill="var(--primary-green)" opacity="0.12" />
            <path
              d="M18 24c0-4 3-7 7-7h6c4 0 7 3 7 7v6c0 4-3 7-7 7h-6l-6 6v-6c-1.7-1.2-3-3.2-3-5.7V24z"
              stroke="var(--primary-green)"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="empty-title">{t('chat.emptyTitle')}</h3>
        <p className="empty-description">{t('chat.emptyDescription')}</p>

        <div className="suggested-messages" role="list">
          {quickResponses.map((msg, index) => (
            <button
              key={quickResponseKeys[index]}
              type="button"
              className="suggested-message"
              role="listitem"
              onClick={() => onSelectMessage?.(msg)}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatEmptyState;
