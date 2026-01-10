const AdminSettingsNotification = ({ notification, onDismiss }) => {
  if (!notification) return null;

  const typeStyles = {
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-primary-200 bg-primary-50 text-primary-900',
  };

  return (
    <div
      className={`mb-6 flex items-start justify-between gap-4 rounded-xl border p-4 text-sm ${
        typeStyles[notification.type] || typeStyles.info
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="flex-1">{notification.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-current/70 transition hover:text-current focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

export default AdminSettingsNotification;
