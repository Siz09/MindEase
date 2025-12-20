import { useTranslation } from 'react-i18next';

const styles = {
  container: {
    padding: 'var(--spacing-lg, 1.5rem) var(--spacing-xl, 2rem)',
    borderBottom: '1px solid var(--gray-200, #e5e7eb)',
    background: 'var(--bg-primary, #ffffff)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  leftSection: { minWidth: 0 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  title: { margin: 0, fontSize: '1.125rem', fontWeight: 700 },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8125rem',
    color: 'var(--text-muted, #6b7280)',
    whiteSpace: 'nowrap',
  },
  subtitle: { margin: '0.25rem 0 0', color: 'var(--text-secondary, #4b5563)' },
  queueBadge: {
    flexShrink: 0,
    fontSize: '0.8125rem',
    color: 'var(--text-secondary, #4b5563)',
    background: 'var(--bg-secondary, #f3f4f6)',
    border: '1px solid var(--gray-200, #e5e7eb)',
    padding: '0.35rem 0.6rem',
    borderRadius: '999px',
  },
};

const getStatusDotStyle = (isConnected) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: isConnected ? 'var(--primary-green, #10b981)' : 'var(--danger-red, #ef4444)',
});

const ChatHeader = ({ isConnected = false, offlineQueueCount = 0 }) => {
  const { t } = useTranslation();

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        <div style={styles.titleRow}>
          <h2 style={styles.title}>{t('chat.title')}</h2>
          <span
            style={styles.statusBadge}
            aria-label={isConnected ? t('chat.connected') : t('chat.disconnected')}
          >
            <span aria-hidden="true" style={getStatusDotStyle(isConnected)} />
            {isConnected ? t('chat.connected') : t('chat.disconnected')}
          </span>
        </div>
        <p style={styles.subtitle}>{t('chat.subtitle')}</p>
      </div>

      {offlineQueueCount > 0 && (
        <div style={styles.queueBadge} title={t('chat.offlineQueueTooltip')}>
          {t('chat.offlineQueueLabel', { count: offlineQueueCount })}
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
