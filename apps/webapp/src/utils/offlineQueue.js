/**
 * Offline message queue management
 * Stores messages when offline and sends them when connection is restored
 */

const QUEUE_STORAGE_KEY = 'mindease_offline_message_queue';

/**
 * Get the offline message queue from localStorage
 */
export const getOfflineQueue = () => {
  try {
    const queue = localStorage.getItem(QUEUE_STORAGE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
};

/**
 * Save the offline message queue to localStorage
 */
export const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
  }
};

/**
 * Add a message to the offline queue
 */
export const addToOfflineQueue = (message) => {
  const queue = getOfflineQueue();
  const queueItem = {
    id: `offline-${Date.now()}-${Math.random()}`,
    message,
    timestamp: Date.now(),
    retryCount: 0,
  };
  queue.push(queueItem);
  saveOfflineQueue(queue);
  return queueItem.id;
};

/**
 * Remove a message from the offline queue
 */
export const removeFromOfflineQueue = (id) => {
  const queue = getOfflineQueue();
  const newQueue = queue.filter((item) => item.id !== id);
  saveOfflineQueue(newQueue);
};

/**
 * Clear all messages from the offline queue
 */
export const clearOfflineQueue = () => {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
};

/**
 * Get the count of messages in the offline queue
 */
export const getOfflineQueueCount = () => {
  return getOfflineQueue().length;
};

/**
 * Update retry count for a queued message
 */
export const incrementRetryCount = (id) => {
  const queue = getOfflineQueue();
  const updatedQueue = queue.map((item) => {
    if (item.id === id) {
      return { ...item, retryCount: (item.retryCount || 0) + 1 };
    }
    return item;
  });
  saveOfflineQueue(updatedQueue);
};
