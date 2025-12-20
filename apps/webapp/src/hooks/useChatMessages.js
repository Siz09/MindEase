import { useState, useRef, useEffect, useCallback } from 'react';
import LRUCache from '../utils/lruCache';
import { MESSAGE_STATUS } from '../utils/messageStatus';

const MAX_MESSAGES_IN_MEMORY = 200; // Keep last 200 messages in memory

const toMessageId = (value) => (value === null || value === undefined ? null : String(value));

const createFallbackMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `msg-${crypto.randomUUID()}`;
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Custom hook for managing chat messages state and operations
 *
 * Features:
 * - Message state management with deduplication
 * - Message status tracking (sent, delivered, etc.)
 * - Message normalization and validation
 * - Memory management (trimming old messages)
 * - LRU cache for processed message IDs
 * - Automatic cleanup of old processed IDs
 *
 * @returns {Object} Message state and operations
 */
export const useChatMessages = () => {
  const [messages, setMessages] = useState([]);
  const [messageStatuses, setMessageStatuses] = useState({});
  const processedMessageIds = useRef(new LRUCache(1000)); // LRU cache with max 1000 entries

  // Normalize message format from various sources
  const normalizeMessage = useCallback((m) => {
    const rawId = m?.id;
    const id = rawId === null || rawId === undefined ? createFallbackMessageId() : String(rawId);
    if (rawId === null || rawId === undefined) {
      console.warn('Message received without ID:', m);
    }
    return {
      id,
      content: m.content || m.message || m.text || 'Empty message',
      isUserMessage: m.isUserMessage || (m.sender ? m.sender === 'user' : false),
      isCrisisFlagged: m.isCrisisFlagged || false,
      // Safety / moderation metadata from backend (if present)
      riskLevel: m.riskLevel || 'NONE',
      moderationAction: m.moderationAction || 'NONE',
      moderationReason: m.moderationReason,
      crisisResources:
        m.crisisResources ||
        (m.crisisResourcesJson
          ? (() => {
              try {
                return JSON.parse(m.crisisResourcesJson);
              } catch (error) {
                console.error('Failed to parse crisisResourcesJson:', error);
                return [];
              }
            })()
          : []),
      createdAt: m.createdAt || new Date().toISOString(),
      sender: m.sender || (m.isUserMessage ? 'user' : 'bot'),
    };
  }, []);

  // Trim messages to prevent memory leaks
  const trimMessages = useCallback(
    (messagesList) => {
      if (messagesList.length > MAX_MESSAGES_IN_MEMORY) {
        // Keep the most recent messages
        const trimmed = messagesList.slice(-MAX_MESSAGES_IN_MEMORY);

        // Also clean up status entries for removed messages
        const keptIds = new Set(trimmed.map((m) => m.id));
        setMessageStatuses((prev) => {
          const cleaned = {};
          Object.keys(prev).forEach((id) => {
            if (keptIds.has(id)) {
              cleaned[id] = prev[id];
            }
          });
          return cleaned;
        });

        console.log(`Trimmed messages from ${messagesList.length} to ${trimmed.length}`);
        return trimmed;
      }
      return messagesList;
    },
    [setMessageStatuses]
  );

  // Add a new message with deduplication
  const addMessage = useCallback(
    (message) => {
      const normalizedMessage = normalizeMessage(message);
      const messageId = normalizedMessage.id;

      // Check if message was already processed
      if (messageId && processedMessageIds.current.has(messageId)) {
        console.debug('Duplicate message detected and skipped:', messageId);
        return false;
      }

      // Mark as processed immediately to prevent race conditions
      if (messageId) {
        processedMessageIds.current.set(messageId, { timestamp: Date.now() });
      }

      // Use functional update to access current messages state
      setMessages((prevMessages) => {
        // Check if message with same content already exists in current messages array
        // This handles race conditions between HTTP response and WebSocket
        const isDuplicate = prevMessages.some(
          (m) =>
            m.id === messageId ||
            (m.content === normalizedMessage.content &&
              m.isUserMessage === normalizedMessage.isUserMessage &&
              Math.abs(new Date(m.createdAt) - new Date(normalizedMessage.createdAt)) < 1000)
        );

        if (isDuplicate) {
          console.debug('Duplicate message content detected and skipped:', messageId);
          return prevMessages; // Return unchanged state
        }

        console.log(
          '✅ Adding new message to chat:',
          normalizedMessage.id,
          normalizedMessage.content.substring(0, 50)
        );
        const updatedMessages = trimMessages([...prevMessages, normalizedMessage]);
        console.log('📊 Total messages after update:', updatedMessages.length);
        return updatedMessages;
      });

      return true;
    },
    [normalizeMessage, trimMessages]
  );

  // Add multiple messages (e.g., from history)
  const addMessages = useCallback(
    (messagesList) => {
      const normalized = (Array.isArray(messagesList) ? messagesList : []).map((m) =>
        normalizeMessage(m)
      );
      const candidates = [];
      const seenIds = new Set();

      for (const msg of normalized) {
        if (!msg?.id) continue;
        if (seenIds.has(msg.id)) continue;
        seenIds.add(msg.id);
        if (processedMessageIds.current.has(msg.id)) continue;
        processedMessageIds.current.set(msg.id, { timestamp: Date.now() });
        candidates.push(msg);
      }

      if (candidates.length === 0) return;

      setMessages((prev) => {
        if (prev.length === 0) return trimMessages(candidates);
        const newIds = new Set(candidates.map((m) => m.id));
        const prevFiltered = prev.filter((m) => !newIds.has(m.id));
        const merged = [...prevFiltered, ...candidates];
        merged.sort((a, b) => {
          const aTime = Date.parse(a.createdAt);
          const bTime = Date.parse(b.createdAt);
          if (!Number.isFinite(aTime) && !Number.isFinite(bTime)) return 0;
          if (!Number.isFinite(aTime)) return -1;
          if (!Number.isFinite(bTime)) return 1;
          return aTime - bTime;
        });
        return trimMessages(merged);
      });
    },
    [normalizeMessage, trimMessages]
  );

  // Prepend older messages (history pagination)
  const prependMessages = useCallback(
    (messagesList) => {
      const normalized = (Array.isArray(messagesList) ? messagesList : []).map((m) =>
        normalizeMessage(m)
      );
      const candidates = [];
      const seenIds = new Set();

      for (const msg of normalized) {
        if (!msg?.id) continue;
        if (seenIds.has(msg.id)) continue;
        seenIds.add(msg.id);
        if (processedMessageIds.current.has(msg.id)) continue;
        processedMessageIds.current.set(msg.id, { timestamp: Date.now() });
        candidates.push(msg);
      }

      if (candidates.length === 0) return;

      setMessages((prev) => {
        if (prev.length === 0) return candidates;
        const prevIds = new Set(prev.map((m) => m.id));
        const toPrepend = candidates.filter((m) => !prevIds.has(m.id));
        if (toPrepend.length === 0) return prev;
        return [...toPrepend, ...prev];
      });
    },
    [normalizeMessage]
  );

  // Update message status
  const updateMessageStatus = useCallback((messageId, status) => {
    const id = toMessageId(messageId);
    if (id === null) return;

    setMessageStatuses((prev) => {
      // Don't regress from DELIVERED to SENT
      if (prev[id] === MESSAGE_STATUS.DELIVERED && status === MESSAGE_STATUS.SENT) {
        return prev;
      }
      return { ...prev, [id]: status };
    });
  }, []);

  // Mark message as delivered (for user messages from server)
  const markMessageDelivered = useCallback(
    (messageId) => {
      updateMessageStatus(messageId, MESSAGE_STATUS.DELIVERED);
    },
    [updateMessageStatus]
  );

  // Mark message as sent (for user messages)
  const markMessageSent = useCallback(
    (messageId) => {
      updateMessageStatus(messageId, MESSAGE_STATUS.SENT);
    },
    [updateMessageStatus]
  );

  // Remove a message
  const removeMessage = useCallback((messageId) => {
    const id = toMessageId(messageId);
    if (id === null) return;

    setMessages((prev) => prev.filter((m) => m.id !== id));
    setMessageStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[id];
      return newStatuses;
    });
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageStatuses({});
    processedMessageIds.current.clear();
  }, []);

  // Check if message was already processed
  const isMessageProcessed = useCallback((messageId) => {
    const id = toMessageId(messageId);
    if (id === null) return false;
    return processedMessageIds.current.has(id);
  }, []);

  // Cleanup old processed message IDs periodically (every 5 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(
      () => {
        const maxAgeMs = 5 * 60 * 1000;
        const removed = processedMessageIds.current.removeOlderThan(maxAgeMs);
        if (removed > 0) {
          console.log(`Cleaned up ${removed} old message IDs from cache`);
        }
      },
      5 * 60 * 1000
    ); // Run every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // State
    messages,
    messageStatuses,

    // Operations
    addMessage,
    addMessages,
    prependMessages,
    removeMessage,
    clearMessages,
    updateMessageStatus,
    markMessageDelivered,
    markMessageSent,

    // Utilities
    normalizeMessage,
    trimMessages,
    isMessageProcessed,
  };
};
