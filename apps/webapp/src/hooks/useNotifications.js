import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function useNotifications(pollInterval = 15000) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previousNotificationsRef = useRef([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use a mock endpoint until the backend is ready
      // TODO: Replace with actual endpoint when NotificationController is implemented
      const response = await api.get('/notifications/list?page=0&size=10');

      const notificationData = response.data?.content || response.data || [];
      setNotifications((prev) => {
        previousNotificationsRef.current = prev;
        return notificationData;
      });

      // Count unread notifications (assuming isSent=false means unread for in-app notifications)
      const unread = notificationData.filter((n) => !n.isSent && n.type === 'IN_APP').length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message);

      // If the endpoint doesn't exist yet or backend is not running, use mock data for development
      if (
        err.response?.status === 404 ||
        err.response?.status === 500 ||
        err.code === 'ERR_NETWORK'
      ) {
        const mockNotifications = [
          {
            id: '1',
            type: 'IN_APP',
            message: 'Welcome to MindEase! Start tracking your mood today.',
            createdAt: new Date().toISOString(),
            isSent: false,
          },
          {
            id: '2',
            type: 'IN_APP',
            message: 'Remember to track your mood daily for better insights.',
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            isSent: true,
          },
        ];
        setNotifications((prev) => {
          previousNotificationsRef.current = prev;
          return mockNotifications;
        });
        setUnreadCount(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/mark-read`);
      // Refresh notifications after marking as read
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // If backend is not available, update local state
      if (
        err.response?.status === 404 ||
        err.response?.status === 500 ||
        err.code === 'ERR_NETWORK'
      ) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, isSent: true } : notif))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      // Refresh notifications after marking all as read
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // If backend is not available, update local state
      if (
        err.response?.status === 404 ||
        err.response?.status === 500 ||
        err.code === 'ERR_NETWORK'
      ) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, isSent: true })));
        setUnreadCount(0);
      }
    }
  };

  // Get new notifications since last fetch
  const getNewNotifications = () => {
    const current = notifications;
    const previous = previousNotificationsRef.current;

    if (previous.length === 0) return current;

    const newNotifications = current.filter(
      (currentNotif) => !previous.some((prevNotif) => prevNotif.id === currentNotif.id)
    );

    return newNotifications;
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    getNewNotifications,
  };
}
