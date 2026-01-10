import { useState, useRef, useEffect, useCallback } from 'react';
import LRUCache from '../utils/lruCache';
import { MESSAGE_STATUS } from '../utils/messageStatus';

const MAX_MESSAGES_IN_MEMORY = 200; // Keep last 200 messages in memory

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
    const id = m.id;
    if (id) {
      processedMessageIds.current.set(id, { timestamp: Date.now() });
    }
    return {
      ...m, // Preserve all original properties (including interactiveType, interactiveState, etc.)
      id,
      content: m.content || m.message || m.text || 'Empty message',
      isUserMessage: m.isUserMessage || (m.sender ? m.sender === 'user' : false),
      isCrisisFlagged: m.isCrisisFlagged || false,
      // Safety / moderation metadata from backend (if present)
      riskLevel: m.riskLevel || 'NONE',
      moderationAction: m.moderationAction || 'NONE',
      moderationReason: m.moderationReason,
      crisisResources:
        m.crisisResources || (m.crisisResourcesJson ? JSON.parse(m.crisisResourcesJson) : []),
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
            if (keptIds.has(Number(id)) || keptIds.has(id)) {
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
      const messageId = message.id;

      // Check if message was already processed
      if (processedMessageIds.current.has(messageId)) {
        console.debug('Duplicate message detected and skipped:', messageId);
        return false;
      }

      // Normalize message first (before duplicate check)
      const normalizedMessage = normalizeMessage({
        ...message,
        id: messageId,
      });

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
          processedMessageIds.current.set(messageId, { timestamp: Date.now() });
          return prevMessages; // Return unchanged state
        }

        processedMessageIds.current.set(messageId, { timestamp: Date.now() });

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
      const normalized = messagesList.map((m) => normalizeMessage(m));
      setMessages((prev) => {
        if (prev.length === 0) return normalized;
        const newIds = new Set(normalized.map((m) => m.id));
        const prevFiltered = prev.filter((m) => !newIds.has(m.id));
        return [...normalized, ...prevFiltered];
      });
    },
    [normalizeMessage]
  );

  // Update message status
  const updateMessageStatus = useCallback((messageId, status) => {
    setMessageStatuses((prev) => {
      // Don't regress from DELIVERED to SENT
      if (prev[messageId] === MESSAGE_STATUS.DELIVERED && status === MESSAGE_STATUS.SENT) {
        return prev;
      }
      return { ...prev, [messageId]: status };
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
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setMessageStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[messageId];
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
    return processedMessageIds.current.has(messageId);
  }, []);

  // Cleanup old processed message IDs periodically (every 5 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(
      () => {
        const fiveMinutesAgo = 5 * 60 * 1000;
        const removed = processedMessageIds.current.removeOlderThan(fiveMinutesAgo);
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

    // Setters (for direct state updates if needed)
    setMessages,
    setMessageStatuses,

    // Operations
    addMessage,
    addMessages,
    removeMessage,
    clearMessages,
    updateMessageStatus,
    markMessageDelivered,
    markMessageSent,

    // Utilities
    normalizeMessage,
    trimMessages,
    isMessageProcessed,

    // Internal refs (for advanced usage)
    processedMessageIds,
  };
};
