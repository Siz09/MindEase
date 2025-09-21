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
          client.subscribe(`/topic/${currentUser.id}`, (message) => {
            const newMessage = JSON.parse(message.body);
            setMessages((prev) => [...prev, newMessage]);
          });

          // Subscribe to public topic for general messages
          client.subscribe('/topic/public', (message) => {
            const newMessage = JSON.parse(message.body);
            setMessages((prev) => [...prev, newMessage]);
          });
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

    // Send message to the server
    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ message: inputValue }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setInputValue('');
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
        <div className="page-header">
          <h1 className="page-title">{t('chat.title')}</h1>
          <p className="page-subtitle">{t('chat.subtitle')}</p>

          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'}
            </div>
            <span>{isConnected ? t('chat.connected') : t('chat.disconnected')}</span>
          </div>
        </div>

        <div className="chat-container" ref={chatContainerRef}>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-icon">💬</div>
                <h3>{t('chat.emptyTitle')}</h3>
                <p>{t('chat.emptyDescription')}</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.isUserMessage ? 'user-message' : 'bot-message'} ${
                    message.isCrisisFlagged ? 'crisis-message' : ''
                  }`}
                >
                  <div className="message-content">
                    <div className="message-text">{message.content}</div>
                    <div className="message-time">{formatTime(message.createdAt)}</div>
                  </div>
                  {message.isCrisisFlagged && (
                    <div className="crisis-warning">⚠️ {t('chat.crisisWarning')}</div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="input-wrapper">
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
                className="send-button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
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
