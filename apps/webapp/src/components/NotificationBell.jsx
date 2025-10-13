import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useNotifications from '../hooks/useNotifications';
import '../styles/NotificationBell.css';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, getNewNotifications } = useNotifications();
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);
  const [displayedIds, setDisplayedIds] = useState(new Set());

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const newNotifications = getNewNotifications();

      // Only show toast for new notifications, not on initial load
      if (previousNotificationCount > 0 && newNotifications.length > 0) {
        const newDisplayedIds = new Set(displayedIds);

        newNotifications.forEach((notification) => {
          if (
            notification.type === 'IN_APP' &&
            !notification.isRead &&
            !displayedIds.has(notification.id)
          ) {
            toast.info(notification.message, {
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            newDisplayedIds.add(notification.id);
          }
        });

        setDisplayedIds(newDisplayedIds);
      }

      setPreviousNotificationCount(notifications.length);
    }
  }, [notifications, getNewNotifications, previousNotificationCount, displayedIds]);

  const handleBellClick = () => {
    navigate('/notifications');
  };

  return (
    <button
      className="notification-bell"
      onClick={handleBellClick}
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
    >
      <div className="bell-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>

      {unreadCount > 0 && (
        <div className="notification-badge" aria-hidden="true">
          <span className="badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
        </div>
      )}
    </button>
  );
}
