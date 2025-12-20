import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { patchQuietHours } from '../utils/api';

export const useQuietHours = ({ currentUser, t }) => {
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [quietHoursLoading, setQuietHoursLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.quietHoursStart?.length >= 5) {
      setQuietStart(currentUser.quietHoursStart.slice(0, 5));
    }
    if (currentUser.quietHoursEnd?.length >= 5) {
      setQuietEnd(currentUser.quietHoursEnd.slice(0, 5));
    }
  }, [currentUser]);

  const saveQuietHours = useCallback(async () => {
    if (!currentUser) return { success: false, error: 'No active session' };

    if (!quietStart || !quietEnd) {
      toast.error(t('settings.notifications.quietHours.emptyTimeError'));
      return { success: false, error: 'Missing time values' };
    }

    if (quietEnd === quietStart) {
      toast.error(t('settings.notifications.quietHours.validationError'));
      return { success: false, error: 'Invalid range' };
    }

    try {
      setQuietHoursLoading(true);
      await patchQuietHours({
        quietHoursStart: `${quietStart}:00`,
        quietHoursEnd: `${quietEnd}:00`,
      });
      toast.success(t('settings.notifications.quietHours.success'));
      return { success: true };
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
      toast.error(t('settings.notifications.quietHours.error'));
      return { success: false, error: error?.message || String(error) };
    } finally {
      setQuietHoursLoading(false);
    }
  }, [currentUser, quietStart, quietEnd, t]);

  return {
    quietStart,
    setQuietStart,
    quietEnd,
    setQuietEnd,
    quietHoursLoading,
    saveQuietHours,
  };
};
