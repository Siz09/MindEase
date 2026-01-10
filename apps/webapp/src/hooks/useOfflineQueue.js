import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  addToOfflineQueue as addToQueueUtil,
  getOfflineQueue,
  removeFromOfflineQueue as removeFromQueueUtil,
  clearOfflineQueue as clearQueueUtil,
  getOfflineQueueCount as getQueueCountUtil,
} from '../utils/offlineQueue';

/**
 * Custom hook for managing offline message queue
 *
 * Features:
 * - Queue count state management
 * - Add/remove messages from queue
 * - Process queue when connection is restored
 * - Sync with online/offline status
 * - Auto-update count when queue changes
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.isOnline - Online/offline status
 * @param {boolean} options.isConnected - WebSocket connection status
 * @param {Function} options.sendMessage - Function to send messages (from sendMessageToServer)
 * @returns {Object} Offline queue state and operations
 */
export const useOfflineQueue = ({ isOnline, isConnected, sendMessage }) => {
  const [offlineQueueCount, setOfflineQueueCount] = useState(() => getQueueCountUtil());

  // Update queue count when online/offline status changes
  useEffect(() => {
    setOfflineQueueCount(getQueueCountUtil());
  }, [isOnline, isConnected]);

  // Add message to offline queue
  const addToQueue = useCallback((messageText) => {
    const queueId = addToQueueUtil(messageText);
    setOfflineQueueCount(getQueueCountUtil());
    return queueId;
  }, []);

  // Remove message from offline queue
  const removeFromQueue = useCallback((queueId) => {
    removeFromQueueUtil(queueId);
    setOfflineQueueCount(getQueueCountUtil());
  }, []);

  // Clear all messages from offline queue
  const clearQueue = useCallback(() => {
    clearQueueUtil();
    setOfflineQueueCount(0);
  }, []);

  // Process offline message queue
  const processQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued messages...`);
    toast.info(`Sending ${queue.length} queued message${queue.length > 1 ? 's' : ''}...`);

    for (const item of queue) {
      try {
        const success = await sendMessage(item.message);
        if (success) {
          removeFromQueueUtil(item.id);
          setOfflineQueueCount(getQueueCountUtil());
        }
      } catch (error) {
        console.error('Error sending queued message:', error);
      }
    }

    const remainingCount = getQueueCountUtil();
    if (remainingCount === 0) {
      toast.success('All queued messages sent!');
    } else {
      toast.warning(`${remainingCount} message${remainingCount > 1 ? 's' : ''} could not be sent`);
    }
  }, [sendMessage]);

  // Note: Auto-processing is handled by the WebSocket hook when connection is restored
  // This prevents duplicate processing

  return {
    // State
    offlineQueueCount,

    // Operations
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,

    // Direct access to utilities (for advanced usage)
    getQueueCount: getQueueCountUtil,
    getQueue: getOfflineQueue,
  };
};
