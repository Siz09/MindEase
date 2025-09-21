'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import '../styles/Chat.css';

const Chat = () => {
  const { t } = useTranslation();
  const { token, currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (token && currentUser) {
      connectWebSocket();
    }

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [token, currentUser]);

  const connectWebSocket = () => {
    try {
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

          // Subscribe to the user's personal chat topic
          client.subscribe(`/topic/user/${currentUser.id}`, (message) => {
            const newMessage = JSON.parse(message.body);
            console.log('Received user message:', newMessage);

            // Only add messages with content
            if (newMessage.content) {
              setMessages((prev) => [...prev, newMessage]);
            }
          });

          // Removed public topic subscription as it's sending empty messages
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          toast.error('Chat connection error');
        },
        onDisconnect: () => {
          setIsConnected(false);
          toast.info('Disconnected from chat');
        },
      });

      client.activate();
      setStompClient(client);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to chat');
    }
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !stompClient || !isConnected) return;

    setIsTyping(true);

    // Send message to the server
    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ message: inputValue }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setInputValue('');

    // Simulate typing indicator
    setTimeout(() => setIsTyping(false), 1500);
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

  // Helper to safely get message content
  const getMessageContent = (message) => {
    return message.content || message.text || message.message || 'Empty message';
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

        <div className="chat-container" ref={chatContainerRef}>
          <div className="chat-messages">
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
                      onClick={() => setInputValue("I'm feeling anxious today")}
                    >
                      "I'm feeling anxious today"
                    </button>
                    <button
                      className="suggested-message"
                      onClick={() => setInputValue('Can you help me relax?')}
                    >
                      "Can you help me relax?"
                    </button>
                    <button
                      className="suggested-message"
                      onClick={() => setInputValue('I need some motivation')}
                    >
                      "I need some motivation"
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
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
                      <div className="message-text">{getMessageContent(message)}</div>
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
