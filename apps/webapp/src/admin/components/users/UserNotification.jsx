const UserNotification = ({ notification, onDismiss }) => {
  if (!notification) return null;

  return (
    <div
      className={`admin-settings-notification admin-settings-notification-${notification.type || 'info'}`}
      style={{ marginBottom: 'var(--spacing-xl)' }}
      role="alert"
    >
      <span>{notification.message}</span>
      <button
        type="button"
        onClick={() => {
          if (typeof onDismiss === 'function') {
            onDismiss();
          }
        }}
        aria-label="Dismiss notification"
        className="admin-settings-notification-close"
      >
        ×
      </button>
    </div>
  );
};

export default UserNotification;
