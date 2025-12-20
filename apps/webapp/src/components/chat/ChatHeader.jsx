import { useTranslation } from 'react-i18next';

const ChatHeader = ({ isConnected = false, offlineQueueCount = 0 }) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        padding: 'var(--spacing-lg, 1.5rem) var(--spacing-xl, 2rem)',
        borderBottom: '1px solid var(--gray-200, #e5e7eb)',
        background: 'var(--bg-primary, #ffffff)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
            {t('chat.title')}
          </h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8125rem',
              color: 'var(--text-muted, #6b7280)',
              whiteSpace: 'nowrap',
            }}
            aria-label={isConnected ? t('chat.connected') : t('chat.disconnected')}
          >
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--primary-green, #10b981)' : '#ef4444',
              }}
            />
            {isConnected ? t('chat.connected') : t('chat.disconnected')}
          </span>
        </div>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary, #4b5563)' }}>
          {t('chat.subtitle')}
        </p>
      </div>

      {offlineQueueCount > 0 && (
        <div
          style={{
            flexShrink: 0,
            fontSize: '0.8125rem',
            color: 'var(--text-secondary, #4b5563)',
            background: 'var(--bg-secondary, #f3f4f6)',
            border: '1px solid var(--gray-200, #e5e7eb)',
            padding: '0.35rem 0.6rem',
            borderRadius: '999px',
          }}
          title="Messages will be sent when reconnected"
        >
          {offlineQueueCount} queued
        </div>
      )}
    </div>
  );
};

export default ChatHeader;

