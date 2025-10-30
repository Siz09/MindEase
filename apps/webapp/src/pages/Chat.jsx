'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import '../styles/Chat.css';
import { apiGet } from '../lib/api';

const Chat = () => {
  const { t } = useTranslation();
  const { token, currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [historyPage, setHistoryPage] = useState(null); // current loaded page index (ascending sort)
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Use refs to track connection state
  const stompClientRef = useRef(null);
  const isConnectingRef = useRef(false);
  const processedMessageIds = useRef(new Set());
  const messagesContainerRef = useRef(null);
  const preventAutoScrollRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (preventAutoScrollRef.current) {
      preventAutoScrollRef.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  // Single WebSocket connection effect
  useEffect(() => {
    if (token && currentUser && !stompClientRef.current && !isConnectingRef.current) {
      connectWebSocket();
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        isConnectingRef.current = false;
        setIsConnected(false);
      }
    };
  }, [token, currentUser]);

  const connectWebSocket = () => {
    if (isConnectingRef.current || stompClientRef.current) {
      return;
    }

    try {
      isConnectingRef.current = true;

      const socket = new SockJS('http://localhost:8080/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setIsConnected(true);
          toast.success('Connected to chat');
          isConnectingRef.current = false;

          const userTopic = `/topic/user/${currentUser.id}`;

          client.subscribe(userTopic, (message) => {
            try {
              const parsedMessage = JSON.parse(message.body);
              const messageId = parsedMessage.id;

              if (processedMessageIds.current.has(messageId)) {
                return;
              }

              processedMessageIds.current.add(messageId);

              const normalizedMessage = {
                id: messageId,
                content:
                  parsedMessage.content ||
                  parsedMessage.message ||
                  parsedMessage.text ||
                  'Empty message',
                isUserMessage: parsedMessage.isUserMessage || false,
                isCrisisFlagged: parsedMessage.isCrisisFlagged || false,
                createdAt: parsedMessage.createdAt || new Date().toISOString(),
                sender: parsedMessage.sender || (parsedMessage.isUserMessage ? 'user' : 'bot'),
              };

              setMessages((prev) => [...prev, normalizedMessage]);
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });

          // Load existing chat history once connected
          loadHistory();
        },

        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          toast.error('Chat connection error');
          isConnectingRef.current = false;
        },

        onDisconnect: () => {
          setIsConnected(false);
          isConnectingRef.current = false;
          toast.info('Disconnected from chat');
        },

        onWebSocketError: (event) => {
          console.error('WebSocket error:', event);
          isConnectingRef.current = false;
          // Fallback: ensure history loads even if WS fails
          if (token && currentUser && historyPage === null) {
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
  };

  const loadHistory = async () => {
    try {
      // First request small page to learn total pages
      const meta = await apiGet('/api/chat/history?page=0&size=1', token);
      const totalPages = Number.isFinite(meta?.totalPages) ? meta.totalPages : 1;
      const lastPage = Math.max(0, totalPages - 1);

      const res = await apiGet(`/api/chat/history?page=${lastPage}&size=50`, token);
      const items = Array.isArray(res?.data) ? res.data : [];
      const normalized = items.map((m) => {
        const id = m.id;
        // Mark as processed to avoid duplicates when websocket echoes same ids
        if (id) processedMessageIds.current.add(id);
        return {
          id,
          content: m.content || m.message || m.text || 'Empty message',
          isUserMessage: m.isUserMessage || (m.sender ? m.sender === 'user' : false),
          isCrisisFlagged: m.isCrisisFlagged || false,
          createdAt: m.createdAt || new Date().toISOString(),
          sender: m.sender || (m.isUserMessage ? 'user' : 'bot'),
        };
      });
      setMessages(normalized);
      setHistoryPage(lastPage);
      setHasMoreHistory(lastPage > 0);
      // Scroll to bottom after initial history load
      setTimeout(scrollToBottom, 0);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      toast.error('Failed to load chat history');
    }
  };

  // Fallback: load history when auth becomes available (even before WS connects)
  useEffect(() => {
    if (token && currentUser && historyPage === null) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  const handleScroll = async () => {
    const el = messagesContainerRef.current;
    if (!el || loadingHistory || !hasMoreHistory) return;
    if (el.scrollTop <= 40) {
      await loadOlderHistory();
    }
  };

  const loadOlderHistory = async () => {
    if (historyPage === null || historyPage <= 0) {
      setHasMoreHistory(false);
      return;
    }
    try {
      setLoadingHistory(true);
      const nextPage = historyPage - 1;
      const el = messagesContainerRef.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;
      const res = await apiGet(`/api/chat/history?page=${nextPage}&size=50`, token);
      const items = Array.isArray(res?.data) ? res.data : [];
      const normalized = items
        .map((m) => {
          const id = m.id;
          if (processedMessageIds.current.has(id)) return null; // skip duplicates
          if (id) processedMessageIds.current.add(id);
          return {
            id,
            content: m.content || m.message || m.text || 'Empty message',
            isUserMessage: m.isUserMessage || (m.sender ? m.sender === 'user' : false),
            isCrisisFlagged: m.isCrisisFlagged || false,
            createdAt: m.createdAt || new Date().toISOString(),
            sender: m.sender || (m.isUserMessage ? 'user' : 'bot'),
          };
        })
        .filter(Boolean);

      if (normalized.length === 0) {
        setHasMoreHistory(false);
      } else {
        preventAutoScrollRef.current = true; // don't jump to bottom
        setMessages((prev) => [...normalized, ...prev]);
        setHistoryPage(nextPage);
        setHasMoreHistory(nextPage > 0);
        // Preserve scroll position after prepending
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
          }
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load older history:', err);
      toast.error('Failed to load older messages');
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) {
      return;
    }

    if (!stompClientRef.current || !isConnected) {
      toast.error('Not connected to chat. Please refresh the page.');
      return;
    }

    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8080/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }

      setInputValue('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setTimeout(() => {
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page chat-page">
      <div className="container">
        <div className="chat-header">
          <div className="chat-header-content">
            <div className="chat-title-section">
              <div className="chat-avatar">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" fill="var(--primary-green)" opacity="0.1" />
                  <path
                    d="M12 16c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z"
                    fill="var(--primary-green)"
                  />
                  <path
                    d="M8 16c0-4.4 3.6-8 8-8s8 3.6 8 4"
                    stroke="var(--primary-green)"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="chat-title-text">
                <h1 className="chat-title">{t('chat.title')}</h1>
                <p className="chat-subtitle">{t('chat.subtitle')}</p>
              </div>
            </div>
            <div className="connection-status">
              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
              <span className="status-text">
                {isConnected ? t('chat.connected') : t('chat.disconnected')}
              </span>
            </div>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
            {messages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-chat-content">
                  <div className="empty-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="28" fill="var(--primary-green)" opacity="0.1" />
                      <path
                        d="M20 32h24M20 24h24M20 40h16"
                        stroke="var(--primary-green)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="empty-title">{t('chat.emptyTitle')}</h3>
                  <p className="empty-description">{t('chat.emptyDescription')}</p>
                  <div className="suggested-messages">
                    <button
                      className="suggested-message"
                      onClick={() => setInputValue(t('chat.quickResponses.anxiety'))}
                    >
                      {t('chat.quickResponses.anxiety')}
                    </button>
                    <button
                      className="suggested-message"
                      onClick={() => setInputValue(t('chat.quickResponses.relax'))}
                    >
                      {t('chat.quickResponses.relax')}
                    </button>
                    <button
                      className="suggested-message"
                      onClick={() => setInputValue(t('chat.quickResponses.motivation'))}
                    >
                      {t('chat.quickResponses.motivation')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.isUserMessage ? 'user-message' : 'bot-message'} ${
                    message.isCrisisFlagged ? 'crisis-message' : ''
                  }`}
                >
                  {!message.isUserMessage && (
                    <div className="message-avatar">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="var(--primary-green)" opacity="0.2" />
                        <path
                          d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
                          stroke="var(--primary-green)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">
                      <div className="message-text">{message.content}</div>
                    </div>
                    <div className="message-meta">
                      <span className="message-time">{formatTime(message.createdAt)}</span>
                      {message.isUserMessage && (
                        <span className="message-status">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M13.5 4.5L6 12l-3.5-3.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  {message.isCrisisFlagged && (
                    <div className="crisis-warning">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1l7 14H1L8 1z" fill="#dc2626" />
                        <path d="M8 6v3M8 11h.01" stroke="white" strokeWidth="1.5" />
                      </svg>
                      {t('chat.crisisWarning')}
                    </div>
                  )}
                </div>
              ))
            )}
            {isTyping && (
              <div className="message bot-message typing-message">
                <div className="message-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="var(--primary-green)" opacity="0.2" />
                    <path
                      d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
                      stroke="var(--primary-green)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="message-content">
                  <div className="message-bubble typing-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div className="message-meta">
                    <span className="message-time">{t('chat.typing')}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <button className="attachment-btn" disabled>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 2v16M2 10h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.inputPlaceholder')}
                className="chat-input"
                rows="1"
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || !isConnected}
                className={`send-button ${inputValue.trim() ? 'active' : ''}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
