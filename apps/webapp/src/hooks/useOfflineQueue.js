import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  addToOfflineQueue,
  clearOfflineQueue,
  getOfflineQueue,
  getOfflineQueueCount,
  incrementRetryCount,
  removeFromOfflineQueue,
} from '../utils/offlineQueue';

const MAX_RETRIES = 3;

export const useOfflineQueue = () => {
  const [offlineQueueCount, setOfflineQueueCount] = useState(() => getOfflineQueueCount());

  const refreshCount = useCallback(() => {
    setOfflineQueueCount(getOfflineQueueCount());
  }, []);

  const addToQueue = useCallback(
    (message) => {
      const id = addToOfflineQueue(message);
      refreshCount();
      return id;
    },
    [refreshCount]
  );

  const removeFromQueue = useCallback(
    (id) => {
      removeFromOfflineQueue(id);
      refreshCount();
    },
    [refreshCount]
  );

  const clearQueue = useCallback(() => {
    clearOfflineQueue();
    refreshCount();
  }, [refreshCount]);

  const processQueue = useCallback(
    async (processItem) => {
      const queue = getOfflineQueue();
      if (queue.length === 0) return;

      for (const item of queue) {
        try {
          await processItem(item.message, item);
          removeFromOfflineQueue(item.id);
          refreshCount();
        } catch (err) {
          incrementRetryCount(item.id);
          refreshCount();

          const nextRetry = (item.retryCount || 0) + 1;
          if (nextRetry >= MAX_RETRIES) {
            toast.error('Failed to send queued message after multiple attempts.');
          } else {
            toast.info(`Queued message failed. Will retry later (attempt ${nextRetry}/${MAX_RETRIES}).`);
          }
        }
      }
    },
    [refreshCount]
  );

  useEffect(() => {
    // Sync across tabs (storage event only fires in other tabs).
    const onStorage = (e) => {
      if (e.key === 'mindease_offline_message_queue') {
        refreshCount();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshCount]);

  return {
    offlineQueueCount,
    refreshCount,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
  };
};

