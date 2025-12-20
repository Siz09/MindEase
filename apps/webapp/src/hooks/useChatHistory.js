import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { apiGet } from '../lib/api';
import { extractTotalPages } from '../utils/chat/messageNormalizer';

/**
 * Custom hook for managing chat history pagination
 *
 * Features:
 * - Initial history loading
 * - Paginated loading of older messages
 * - Scroll position restoration when prepending messages
 * - Loading state management
 * - Tracking of available history pages
 *
 * @param {Object} options - Configuration options
 * @param {string} options.token - Authentication token
 * @param {Object} options.currentUser - Current user object
 * @param {Function} options.addMessages - Function to add messages (from useChatMessages)
 * @param {Function} options.prependMessages - Function to prepend messages (for history pagination)
 * @param {Function} options.normalizeMessage - Function to normalize message format
 * @param {Function} options.isMessageProcessed - Function to check if message was processed
 * @param {Object} options.messagesContainerRef - Ref to messages container element
 * @param {Object} options.preventAutoScrollRef - Ref to prevent auto-scroll
 * @param {Object} options.prevScrollHeightRef - Ref to store previous scroll height
 * @returns {Object} History state and operations
 */
export const useChatHistory = ({
  token,
  currentUser,
  addMessages,
  prependMessages,
  normalizeMessage,
  isMessageProcessed,
  messagesContainerRef,
  preventAutoScrollRef,
  prevScrollHeightRef,
}) => {
  const [historyPage, setHistoryPage] = useState(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const loadingHistoryRef = useRef(false);

  // Load initial chat history
  const loadHistory = useCallback(async () => {
    if (loadingHistoryRef.current) return;
    try {
      loadingHistoryRef.current = true;
      setLoadingHistory(true);
      const pageSize = 50;
      // Request newest first; reverse to chronological for UI
      const res = await apiGet(`/api/chat/history?page=0&size=${pageSize}&sort=desc`, token);
      const totalPages = extractTotalPages(res) ?? 1;
      const items = Array.isArray(res?.data) ? res.data.slice().reverse() : [];
      const normalized = items
        .map((m) => {
          const id = m?.id;
          if (id !== null && id !== undefined && isMessageProcessed(id)) return null;
          return normalizeMessage(m);
        })
        .filter(Boolean);
      addMessages(normalized);
      setHistoryPage(0);
      setHasMoreHistory(totalPages > 1);
      setInitialLoadComplete(true);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      toast.error('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
      loadingHistoryRef.current = false;
    }
  }, [token, addMessages, isMessageProcessed, normalizeMessage]);

  // Load older messages (prepend to existing messages)
  const loadOlderHistory = useCallback(async () => {
    if (historyPage === null || loadingHistoryRef.current) return;
    try {
      loadingHistoryRef.current = true;
      setLoadingHistory(true);
      const nextPage = historyPage + 1; // older when using sort=desc on API
      const el = messagesContainerRef?.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;
      const res = await apiGet(`/api/chat/history?page=${nextPage}&size=50&sort=desc`, token);
      const totalPages = extractTotalPages(res);
      const items = Array.isArray(res?.data) ? res.data.slice().reverse() : [];
      const normalized = items
        .map((m) => {
          const id = m?.id;
          if (id !== null && id !== undefined && isMessageProcessed(id)) return null;
          return normalizeMessage(m);
        })
        .filter(Boolean);

      setHistoryPage(nextPage);
      if (typeof totalPages === 'number') {
        setHasMoreHistory(nextPage < totalPages - 1);
      } else if (normalized.length === 0) {
        setHasMoreHistory(false);
      }

      if (normalized.length > 0) {
        // Prevent auto-scroll and store scroll position for restoration
        if (preventAutoScrollRef) {
          preventAutoScrollRef.current = true;
        }
        if (prevScrollHeightRef) {
          prevScrollHeightRef.current = prevScrollHeight;
        }
        // Prepend older messages (special case for history pagination)
        prependMessages(normalized);
      }
    } catch (err) {
      console.error('Failed to load older history:', err);
      toast.error('Failed to load older messages');
    } finally {
      setLoadingHistory(false);
      loadingHistoryRef.current = false;
    }
  }, [
    historyPage,
    token,
    messagesContainerRef,
    preventAutoScrollRef,
    prevScrollHeightRef,
    isMessageProcessed,
    normalizeMessage,
    prependMessages,
  ]);

  // Auto-load history when auth becomes available
  useEffect(() => {
    if (token && currentUser && historyPage === null) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  return {
    // State
    historyPage,
    hasMoreHistory,
    loadingHistory,
    initialLoadComplete,

    // Operations
    loadHistory,
    loadOlderHistory,

    // Setters (for external control if needed)
    setHistoryPage,
    setHasMoreHistory,
    setLoadingHistory,
    setInitialLoadComplete,
  };
};
