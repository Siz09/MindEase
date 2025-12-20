import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getOfflineQueueCount } from '../utils/offlineQueue';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  ''
);

/**
 * Custom hook for managing WebSocket connection to chat service
 *
 * Features:
 * - Automatic connection/disconnection management
 * - Exponential backoff reconnection strategy
 * - Token expiration handling with auto-refresh
 * - Offline queue processing on reconnect
 * - Message and typing indicator subscriptions
 * - Cleanup on unmount
 *
 * @param {Object} options - Configuration options
 * @param {string} options.token - Authentication token
 * @param {Object} options.currentUser - Current user object
 * @param {boolean} options.isOnline - Online/offline status
 * @param {Function} options.onMessage - Callback when message received
 * @param {Function} options.onTyping - Callback when typing indicator received
 * @param {Function} options.onConnect - Callback when connected
 * @param {Function} options.processOfflineQueue - Function to process offline queue
 * @param {Function} options.loadHistory - Function to load chat history
 * @param {number} options.historyPage - Current history page (null if not loaded)
 * @param {boolean} options.loadingHistory - Whether history is currently loading
 * @returns {Object} WebSocket connection state and methods
 */
export const useWebSocket = ({
  token,
  currentUser,
  isOnline,
  onMessage,
  onTyping,
  onConnect,
  processOfflineQueue,
  loadHistory,
  historyPage,
  loadingHistory,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef(null);
  const isConnectingRef = useRef(false);
  const isIntentionallyDisconnectingRef = useRef(false);
  const subscriptionsRef = useRef([]);

  // Reconnection backoff state
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
  const BASE_RECONNECT_DELAY = 1000; // Start with 1 second
  const connectWebSocketRef = useRef(null); // Ref to avoid circular dependency

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
      MAX_RECONNECT_DELAY
    );
    return delay;
  }, []);

  // Reset reconnection state on successful connection
  const resetReconnectState = useCallback(() => {
    reconnectAttempts.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (isConnectingRef.current || stompClientRef.current) {
      return;
    }

    if (!token || !currentUser) {
      console.log('⏸️ WebSocket connection skipped: missing token or user');
      return;
    }

    try {
      isIntentionallyDisconnectingRef.current = false; // Reset flag when connecting
      isConnectingRef.current = true;

      const socket = new SockJS(`${API_BASE_URL}/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 0, // Disable built-in reconnection; use custom exponential backoff
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame) => {
          console.log('✅ WebSocket connected successfully', frame);
          setIsConnected(true);
          isConnectingRef.current = false;
          isIntentionallyDisconnectingRef.current = false; // Reset flag on successful connection
          const wasReconnecting = reconnectAttempts.current > 0;
          resetReconnectState(); // Reset backoff on successful connection

          if (wasReconnecting) {
            toast.success('Reconnected successfully!');
          }

          // Process offline queue when reconnected
          if (isOnline && getOfflineQueueCount() > 0 && processOfflineQueue) {
            setTimeout(() => processOfflineQueue(), 1000);
          }

          const userTopic = `/topic/user/${currentUser.id}`;
          console.log('🔌 Subscribing to WebSocket topic:', userTopic);

          // Verify client is active
          if (!client.connected) {
            console.error('❌ Client not connected after onConnect callback!');
            return;
          }

          // Subscribe to messages
          const messageSubscription = client.subscribe(userTopic, (message) => {
            try {
              console.log('📨 WebSocket message received:', message.body);
              const parsedMessage = JSON.parse(message.body);

              if (onMessage) {
                onMessage(parsedMessage);
              }
            } catch (error) {
              console.error('❌ Error processing WebSocket message:', error);
              console.error('Message body:', message.body);
              toast.error('Error receiving message. Please refresh the page.');
            }
          });
          subscriptionsRef.current.push(messageSubscription);
          console.log('✅ WebSocket subscription active for:', userTopic);
          console.log('📋 Active subscriptions count:', subscriptionsRef.current.length);

          // Subscribe to typing indicator
          const typingSubscription = client.subscribe(userTopic + '/typing', (message) => {
            try {
              const typingEvent = JSON.parse(message.body);
              if (onTyping) {
                onTyping(typingEvent.isTyping);
              }
              console.log(
                'Typing indicator:',
                typingEvent.isTyping ? 'Bot is typing...' : 'Bot stopped typing'
              );
            } catch (error) {
              console.error('Error parsing typing event:', error);
            }
          });
          subscriptionsRef.current.push(typingSubscription);

          // Load existing chat history once connected
          if (historyPage === null && !loadingHistory && loadHistory) {
            loadHistory();
          }

          // Call onConnect callback if provided
          if (onConnect) {
            onConnect();
          }
        },

        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          isConnectingRef.current = false;

          // Check if error is due to token expiration
          const errorMessage = frame?.headers?.message || frame?.body || '';
          if (errorMessage.includes('expired') || errorMessage.includes('JWT token has expired')) {
            console.log('Token expired, attempting to refresh and reconnect...');
            toast.info('Reconnecting with fresh session...');

            // Disconnect current client
            if (stompClientRef.current) {
              try {
                stompClientRef.current.deactivate();
              } catch (e) {
                console.error('Error deactivating client:', e);
              }
              stompClientRef.current = null;
            }

            // Reset backoff for token expiration (not a network issue)
            resetReconnectState();

            // Trigger token refresh by reloading user data
            // The token will be refreshed automatically by the axios interceptor
            setTimeout(() => {
              if (connectWebSocketRef.current) {
                connectWebSocketRef.current();
              }
            }, 1000);
          } else {
            toast.error('Chat connection error');
            // Schedule reconnection with backoff for other errors
            if (connectWebSocketRef.current && !reconnectTimeoutRef.current) {
              const delay = getReconnectDelay();
              reconnectAttempts.current += 1;
              console.log(
                `Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`
              );
              toast.info(
                `Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${reconnectAttempts.current})`
              );
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (connectWebSocketRef.current) {
                  connectWebSocketRef.current();
                }
              }, delay);
            }
          }
        },

        onDisconnect: () => {
          setIsConnected(false);
          isConnectingRef.current = false;
          // Don't show toast during intentional disconnection (cleanup/unmount)
          if (!isIntentionallyDisconnectingRef.current) {
            toast.info('Disconnected from chat');
            // Schedule reconnection with backoff
            if (connectWebSocketRef.current && !reconnectTimeoutRef.current) {
              const delay = getReconnectDelay();
              reconnectAttempts.current += 1;
              console.log(
                `Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`
              );
              toast.info(
                `Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${reconnectAttempts.current})`
              );
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (connectWebSocketRef.current) {
                  connectWebSocketRef.current();
                }
              }, delay);
            }
          }
        },

        onWebSocketError: (event) => {
          // Don't log errors during intentional disconnection (cleanup/unmount)
          // Check flag, if client is null (already cleaned up), or if it's a generic error event
          const isCleanup =
            isIntentionallyDisconnectingRef.current ||
            !stompClientRef.current ||
            (event && event.type === 'error' && !event.message && !event.reason);

          if (!isCleanup) {
            console.error('WebSocket error:', event);
            // Schedule reconnection with backoff
            if (connectWebSocketRef.current && !reconnectTimeoutRef.current) {
              const delay = getReconnectDelay();
              reconnectAttempts.current += 1;
              console.log(
                `Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`
              );
              toast.info(
                `Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${reconnectAttempts.current})`
              );
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (connectWebSocketRef.current) {
                  connectWebSocketRef.current();
                }
              }, delay);
            }
          }
          isConnectingRef.current = false;
          // Fallback: ensure history loads even if WS fails (only if not disconnecting)
          if (!isCleanup && token && currentUser && historyPage === null && loadHistory) {
            loadHistory();
          }
        },
      });

      stompClientRef.current = client;
      client.activate();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to chat');
      isConnectingRef.current = false;
    }
  }, [
    token,
    currentUser,
    isOnline,
    onMessage,
    onTyping,
    onConnect,
    processOfflineQueue,
    loadHistory,
    historyPage,
    loadingHistory,
    resetReconnectState,
    getReconnectDelay,
  ]);

  // Store connect function in ref to avoid circular dependency
  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    // Set flag first to prevent any error handlers from logging
    isIntentionallyDisconnectingRef.current = true;

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (stompClientRef.current) {
      const client = stompClientRef.current;

      // Unsubscribe from all subscriptions
      subscriptionsRef.current.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.debug('Error unsubscribing:', e);
        }
      });
      subscriptionsRef.current = [];

      // Set ref to null BEFORE deactivating so error handlers see it's null
      stompClientRef.current = null;
      isConnectingRef.current = false;
      setIsConnected(false);

      try {
        client.deactivate();
      } catch {
        // Ignore errors during cleanup
      }
    }
  }, []);

  // Send message via WebSocket (if needed for direct sending)
  const sendMessage = useCallback(
    (destination, body, headers = {}) => {
      if (!stompClientRef.current || !isConnected) {
        console.warn('Cannot send message: WebSocket not connected');
        return false;
      }

      try {
        stompClientRef.current.publish({
          destination,
          body: JSON.stringify(body),
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        });
        return true;
      } catch (error) {
        console.error('Error sending message via WebSocket:', error);
        return false;
      }
    },
    [isConnected, token]
  );

  // Auto-connect when token and user are available
  useEffect(() => {
    if (token && currentUser && !stompClientRef.current && !isConnectingRef.current) {
      console.log('🔄 Attempting WebSocket connection...', {
        hasToken: !!token,
        hasUser: !!currentUser,
        userId: currentUser?.id,
      });
      connectWebSocket();
    } else {
      console.log('⏸️ WebSocket connection skipped:', {
        hasToken: !!token,
        hasUser: !!currentUser,
        hasClient: !!stompClientRef.current,
        isConnecting: isConnectingRef.current,
      });
    }

    return () => {
      disconnectWebSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  return {
    isConnected,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage,
    client: stompClientRef.current,
  };
};
