const AdminSettingsNotification = ({ notification, onDismiss }) => {
  if (!notification) return null;

  return (
    <div className={`admin-settings-notification admin-settings-notification-${notification.type}`}>
      <span>{notification.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="admin-settings-notification-close"
      >
        ×
      </button>
    </div>
  );
};

export default AdminSettingsNotification;

