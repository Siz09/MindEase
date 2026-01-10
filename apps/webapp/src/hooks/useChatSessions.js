'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createChatSession,
  getChatSessions,
  updateChatSession,
  deleteChatSession,
} from '../lib/api';

/**
 * Custom hook for managing chat sessions (multi-chat like ChatGPT)
 *
 * Features:
 * - List all chat sessions
 * - Create new sessions
 * - Update session titles
 * - Delete sessions
 * - Auto-refresh on certain events
 *
 * @returns {Object} Session management state and operations
 */
export const useChatSessions = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const abortControllerRef = useRef(null);

  /**
   * Load all chat sessions for the current user
   */
  const loadSessions = useCallback(async () => {
    if (!token) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await getChatSessions(token, {
        signal: abortControllerRef.current.signal,
      });

      if (response?.status === 'success' && Array.isArray(response.data)) {
        setSessions(response.data);
      } else {
        setSessions([]);
      }
      setInitialLoadComplete(true);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load chat sessions:', err);
      setError(err.message || 'Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Create a new chat session
   * @returns {Promise<string|null>} The new session ID or null on failure
   */
  const createSession = useCallback(async () => {
    if (!token) return null;

    try {
      const response = await createChatSession(token);

      if (response?.status === 'success' && response.id) {
        // Add the new session to the top of the list
        const newSession = {
          id: response.id,
          title: response.title || 'New Chat',
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          preview: null,
        };
        setSessions((prev) => [newSession, ...prev]);
        return response.id;
      }

      throw new Error('Invalid response from server');
    } catch (err) {
      console.error('Failed to create chat session:', err);
      setError(err.message || 'Failed to create chat session');
      return null;
    }
  }, [token]);

  /**
   * Update a session's title
   * @param {string} sessionId - The session ID
   * @param {string} title - The new title
   * @returns {Promise<boolean>} Whether the update was successful
   */
  const updateTitle = useCallback(
    async (sessionId, title) => {
      if (!token || !sessionId) return false;

      try {
        const response = await updateChatSession(sessionId, title, token);

        if (response?.status === 'success') {
          // Update the session in the local state
          setSessions((prev) =>
            prev.map((session) =>
              session.id === sessionId
                ? { ...session, title: response.title || title, updatedAt: response.updatedAt }
                : session
            )
          );
          return true;
        }

        throw new Error('Invalid response from server');
      } catch (err) {
        console.error('Failed to update session title:', err);
        setError(err.message || 'Failed to update session title');
        return false;
      }
    },
    [token]
  );

  /**
   * Delete a chat session
   * @param {string} sessionId - The session ID to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  const deleteSession = useCallback(
    async (sessionId) => {
      if (!token || !sessionId) return false;

      try {
        const response = await deleteChatSession(sessionId, token);

        if (response?.status === 'success') {
          // Remove the session from local state
          setSessions((prev) => prev.filter((session) => session.id !== sessionId));
          return true;
        }

        throw new Error('Invalid response from server');
      } catch (err) {
        console.error('Failed to delete chat session:', err);
        setError(err.message || 'Failed to delete chat session');
        return false;
      }
    },
    [token]
  );

  /**
   * Refresh a specific session's data (e.g., after sending a message)
   * @param {string} sessionId - The session ID to refresh
   */
  const refreshSession = useCallback(
    async (sessionId) => {
      // For now, reload all sessions to get updated data
      // Could be optimized to only fetch the specific session
      await loadSessions();
    },
    [loadSessions]
  );

  /**
   * Move a session to the top of the list (after activity)
   * @param {string} sessionId - The session ID
   */
  const bumpSession = useCallback((sessionId) => {
    setSessions((prev) => {
      const sessionIndex = prev.findIndex((s) => s.id === sessionId);
      if (sessionIndex <= 0) return prev; // Already at top or not found

      const session = prev[sessionIndex];
      const newSessions = [...prev];
      newSessions.splice(sessionIndex, 1);
      newSessions.unshift({ ...session, updatedAt: new Date().toISOString() });
      return newSessions;
    });
  }, []);

  /**
   * Update a session's title locally (optimistic update)
   * @param {string} sessionId - The session ID
   * @param {string} title - The new title
   */
  const updateSessionTitleLocally = useCallback((sessionId, title) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, title } : session))
    );
  }, []);

  // Load sessions on mount
  useEffect(() => {
    if (token) {
      loadSessions();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [token, loadSessions]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    sessions,
    loading,
    error,
    initialLoadComplete,
    loadSessions,
    createSession,
    updateTitle,
    deleteSession,
    refreshSession,
    bumpSession,
    updateSessionTitleLocally,
  };
};

export default useChatSessions;
