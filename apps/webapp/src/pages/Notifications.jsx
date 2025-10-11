import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useNotifications from '../hooks/useNotifications';
import '../styles/Notifications.css';

export default function Notifications() {
  const { t } = useTranslation();
  const { notifications, unreadCount, loading, error, refresh, markAsRead, markAllAsRead } =
    useNotifications();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  // Filter notifications to show only IN_APP type
  const inAppNotifications = notifications.filter((n) => n.type === 'IN_APP');

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      toast.success(t('notifications.markReadSuccess'));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error(t('notifications.markReadError'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success(t('notifications.markAllReadSuccess'));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error(t('notifications.markAllReadError'));
    }
  };

  const handleRefresh = async () => {
    await refresh();
    toast.info(t('notifications.refreshSuccess'));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const diffInHoursRounded = Math.floor(diffInHours);
      return `${diffInHoursRounded} hour${diffInHoursRounded !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'IN_APP':
        return '🔔';
      case 'EMAIL':
        return '📧';
      default:
        return '📢';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('notifications.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {/* Header */}
        <div className="notifications-header">
          <div className="header-content">
            <h1 className="page-title">{t('notifications.title')}</h1>
            <div className="header-stats">
              <span className="unread-count">
                {unreadCount} {t('notifications.unreadCount')}
              </span>
            </div>
          </div>

          <div className="header-actions">
            {unreadCount > 0 && (
              <button
                className="btn btn-outline mark-all-btn"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
            <button
              className="btn btn-secondary refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              {t('notifications.refresh')}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>
                {t('notifications.fetchError')}: {error}
              </span>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="notifications-content">
          {inAppNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3>{t('notifications.noNotifications')}</h3>
              <p>{t('notifications.allCaughtUp')}</p>
            </div>
          ) : (
            <div className="notifications-list">
              {inAppNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isSent ? 'unread' : 'read'}`}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-meta">
                        <span className="notification-type">{notification.type}</span>
                        <span className="notification-time">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      {!notification.isSent && <div className="unread-indicator"></div>}
                    </div>

                    <div className="notification-message">{notification.message}</div>

                    {!notification.isSent && (
                      <div className="notification-actions">
                        <button
                          className="btn btn-sm btn-outline mark-read-btn"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          {t('notifications.markAsRead')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination (if needed in the future) */}
        {inAppNotifications.length >= pageSize && (
          <div className="pagination-container">
            <button
              className="btn btn-outline"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            <span className="page-info">Page {currentPage + 1}</span>
            <button
              className="btn btn-outline"
              disabled={inAppNotifications.length < pageSize}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
