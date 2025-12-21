import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from '../adminApi';

const defaults = {
  crisisThreshold: 5,
  emailNotifications: 'all',
  autoArchive: true,
  autoArchiveDays: 30,
  dailyReportTime: '09:00',
};

export default function useAdminSettings() {
  const [crisisThreshold, setCrisisThreshold] = useState(defaults.crisisThreshold);
  const [emailNotifications, setEmailNotifications] = useState(defaults.emailNotifications);
  const [autoArchive, setAutoArchive] = useState(defaults.autoArchive);
  const [autoArchiveDays, setAutoArchiveDays] = useState(defaults.autoArchiveDays);
  const [dailyReportTime, setDailyReportTime] = useState(defaults.dailyReportTime);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(false);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/admin/settings');
      if (!isMountedRef.current || !data) return;

      if (typeof data.crisisThreshold === 'number') {
        setCrisisThreshold(Math.max(1, Math.min(10, data.crisisThreshold)));
      }
      if (typeof data.emailNotifications === 'string') {
        const validOptions = ['all', 'critical', 'none'];
        if (validOptions.includes(data.emailNotifications)) {
          setEmailNotifications(data.emailNotifications);
        }
      }
      if (typeof data.autoArchive === 'boolean') setAutoArchive(data.autoArchive);
      if (typeof data.autoArchiveDays === 'number') {
        setAutoArchiveDays(Math.max(1, Math.min(365, data.autoArchiveDays)));
      }
      if (typeof data.dailyReportTime === 'string') {
        if (/^([0-1]\\d|2[0-3]):[0-5]\\d$/.test(data.dailyReportTime)) {
          setDailyReportTime(data.dailyReportTime);
        }
      }
    } catch (err) {
      console.error('Failed to load admin settings:', err?.message || err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadSettings();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadSettings]);

  const save = useCallback(async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      await adminApi.post('/admin/settings', {
        crisisThreshold,
        emailNotifications,
        autoArchive,
        autoArchiveDays: autoArchive ? autoArchiveDays : null,
        dailyReportTime,
      });
      if (isMountedRef.current) {
        setNotification({ type: 'success', message: 'Settings saved successfully.' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error?.message || error);
      if (isMountedRef.current) {
        setNotification({ type: 'error', message: 'Unable to save settings.' });
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [autoArchive, autoArchiveDays, crisisThreshold, dailyReportTime, emailNotifications]);

  const reset = useCallback(() => {
    setCrisisThreshold(defaults.crisisThreshold);
    setEmailNotifications(defaults.emailNotifications);
    setAutoArchive(defaults.autoArchive);
    setAutoArchiveDays(defaults.autoArchiveDays);
    setDailyReportTime(defaults.dailyReportTime);
    setNotification({ type: 'info', message: 'Settings reset to defaults.' });
  }, []);

  useEffect(() => {
    if (notification && notification.type !== 'error') {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return {
    crisisThreshold,
    setCrisisThreshold,
    emailNotifications,
    setEmailNotifications,
    autoArchive,
    setAutoArchive,
    autoArchiveDays,
    setAutoArchiveDays,
    dailyReportTime,
    setDailyReportTime,
    notification,
    setNotification,
    isLoading,
    save,
    reset,
  };
}

