import { useCallback, useRef, useEffect } from 'react';
import api from '../utils/api';

/**
 * Custom hook for polling AI summary completion for journal entries.
 * Extracted from Journal.jsx for reuse across components.
 *
 * @param {Function} onComplete - Callback when AI summary is found (receives updated entry)
 * @param {Object} options - Configuration options
 * @param {number} options.maxAttempts - Maximum polling attempts (default: 8)
 * @param {number} options.intervalMs - Polling interval in milliseconds (default: 1500)
 * @returns {Function} Function to start polling for a given entry ID
 */
const useAICompletionPolling = (onComplete, options = {}) => {
  const { maxAttempts = 8, intervalMs = 1500 } = options;
  const pollingMapRef = useRef(new Map());

  // Cleanup on unmount
  useEffect(() => {
    const pollingMap = pollingMapRef.current;
    return () => {
      if (pollingMap) {
        for (const id of pollingMap.values()) {
          clearInterval(id);
        }
        pollingMap.clear();
      }
    };
  }, []);

  const pollForAICompletion = useCallback(
    (entryId, updateEntries) => {
      if (!entryId) return;

      // Clear any existing polling for this entry
      if (pollingMapRef.current) {
        const existing = pollingMapRef.current.get(entryId);
        if (existing) clearInterval(existing);
      }

      let attempts = 0;
      const id = setInterval(async () => {
        attempts += 1;
        try {
          const historyRes = await api.get('/journal/history?page=0&size=10');
          if (historyRes) {
            const payload = historyRes.data || {};
            const list = payload.entries || [];
            const found = list.find((it) => it.id === entryId);

            if (found && (found.aiSummary || found.moodInsight)) {
              // AI summary is complete
              clearInterval(id);
              pollingMapRef.current.delete(entryId);

              // Call the completion callback
              if (onComplete) {
                onComplete(found);
              }

              // Also call updateEntries if provided (for backward compatibility)
              if (updateEntries) {
                updateEntries((prev) => {
                  const idx = prev.findIndex((it) => it.id === entryId);
                  if (idx === -1) return prev;
                  const next = prev.slice();
                  next[idx] = found;
                  return next;
                });
              }
              return;
            }
          }
        } catch (error) {
          console.error('Error polling for AI completion:', error);
        }

        // Stop after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(id);
          pollingMapRef.current.delete(entryId);
        }
      }, intervalMs);

      pollingMapRef.current.set(entryId, id);
    },
    [maxAttempts, intervalMs, onComplete]
  );

  return pollForAICompletion;
};

export default useAICompletionPolling;
