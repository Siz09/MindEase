import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { apiGet } from '../lib/api';

/**
 * Utility to extract total pages from API response
 */
const extractTotalPages = (res) =>
  Number.isFinite(res?.pagination?.totalPages)
    ? res.pagination.totalPages
    : Number.isFinite(res?.totalPages)
      ? res.totalPages
      : undefined;

/**
 * Custom hook for managing chat history pagination
 *
 * Features:
 * - Initial history loading for a specific chatId
 * - Paginated loading of older messages
 * - Scroll position restoration when prepending messages
 * - Loading state management
 * - Tracking of available history pages
 * - Resets when chatId changes
 *
 * @param {Object} options - Configuration options
 * @param {string} options.token - Authentication token
 * @param {Object} options.currentUser - Current user object
 * @param {string} options.chatId - Optional chat session ID (if not provided, uses most recent)
 * @param {Function} options.addMessages - Function to add messages (from useChatMessages)
 * @param {Function} options.setMessages - Function to set messages directly (for prepending)
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
  chatId,
  addMessages,
  setMessages,
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
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const previousChatIdRef = useRef(chatId);

  // Build API path with optional sessionId
  const buildHistoryPath = useCallback(
    (page, size = 50, sort = 'desc') => {
      let path = `/api/chat/history?page=${page}&size=${size}&sort=${sort}`;
      if (chatId) {
        path += `&sessionId=${chatId}`;
      }
      return path;
    },
    [chatId]
  );

  // Reset state when chatId changes
  useEffect(() => {
    if (previousChatIdRef.current !== chatId) {
      previousChatIdRef.current = chatId;
      setHistoryPage(null);
      setHasMoreHistory(true);
      setLoadingHistory(false);
      setInitialLoadComplete(false);
      setCurrentSessionId(null);
      // Clear existing messages when switching chats
      if (setMessages) {
        setMessages([]);
      }
    }
  }, [chatId, setMessages]);

  // Load initial chat history
  const loadHistory = useCallback(
    async (forceSessionId = null) => {
      if (loadingHistory) return;
      try {
        setLoadingHistory(true);
        const pageSize = 50;
        // Use forceSessionId if provided, otherwise use chatId
        const sessionIdToUse = forceSessionId || chatId;
        let path = `/api/chat/history?page=0&size=${pageSize}&sort=desc`;
        if (sessionIdToUse) {
          path += `&sessionId=${sessionIdToUse}`;
        }
        // Request newest first; reverse to chronological for UI
        const res = await apiGet(path, token);
        const totalPages = extractTotalPages(res) ?? 1;
        const items = Array.isArray(res?.data) ? res.data.slice().reverse() : [];

        // Store the sessionId from the response (useful when no chatId was specified)
        if (res?.sessionId) {
          setCurrentSessionId(res.sessionId);
        }

        addMessages(items);
        setHistoryPage(0);
        setHasMoreHistory(totalPages > 1);
        setInitialLoadComplete(true);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        // Toast notification removed - errors are logged to console only
      } finally {
        setLoadingHistory(false);
      }
    },
    [token, loadingHistory, addMessages, chatId]
  );

  // Load older messages (prepend to existing messages)
  const loadOlderHistory = useCallback(async () => {
    if (historyPage === null) return;
    try {
      setLoadingHistory(true);
      const nextPage = historyPage + 1; // older when using sort=desc on API
      const el = messagesContainerRef?.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;
      const res = await apiGet(buildHistoryPath(nextPage, 50, 'desc'), token);
      const totalPages = extractTotalPages(res);
      const items = Array.isArray(res?.data) ? res.data.slice().reverse() : [];
      const normalized = items
        .map((m) => {
          if (isMessageProcessed(m.id)) return null;
          return normalizeMessage(m);
        })
        .filter(Boolean);

      if (normalized.length === 0) {
        setHasMoreHistory(false);
      } else {
        // Prevent auto-scroll and store scroll position for restoration
        if (preventAutoScrollRef) {
          preventAutoScrollRef.current = true;
        }
        if (prevScrollHeightRef) {
          prevScrollHeightRef.current = prevScrollHeight;
        }
        // Prepend older messages (special case for history pagination)
        setMessages((prev) => [...normalized, ...prev]);
        setHistoryPage(nextPage);
        if (typeof totalPages === 'number') {
          setHasMoreHistory(nextPage < totalPages - 1);
        }
      }
    } catch (err) {
      console.error('Failed to load older history:', err);
      toast.error('Failed to load older messages');
    } finally {
      setLoadingHistory(false);
    }
  }, [
    historyPage,
    token,
    buildHistoryPath,
    messagesContainerRef,
    preventAutoScrollRef,
    prevScrollHeightRef,
    isMessageProcessed,
    normalizeMessage,
    setMessages,
  ]);

  // Auto-load history when auth becomes available or chatId changes
  useEffect(() => {
    if (token && currentUser && historyPage === null) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser, chatId]);

  return {
    // State
    historyPage,
    hasMoreHistory,
    loadingHistory,
    initialLoadComplete,
    currentSessionId,

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
