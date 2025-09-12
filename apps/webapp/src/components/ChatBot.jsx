'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ChatBot.css';

const ChatBot = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: t('chatbot.welcomeMessage'),
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Simple response logic - in a real app, this would connect to an AI service
    if (lowerMessage.includes('mood') || lowerMessage.includes('feeling')) {
      return t('chatbot.moodResponse');
    } else if (lowerMessage.includes('journal') || lowerMessage.includes('write')) {
      return t('chatbot.journalResponse');
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return t('chatbot.helpResponse');
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
      return t('chatbot.stressResponse');
    } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
      return t('chatbot.sleepResponse');
    } else {
      return t('chatbot.defaultResponse');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickResponses = [
    t('chatbot.quickResponse1'),
    t('chatbot.quickResponse2'),
    t('chatbot.quickResponse3'),
    t('chatbot.quickResponse4'),
  ];

  const handleQuickResponse = (response) => {
    setInputValue(response);
    inputRef.current?.focus();
  };

  return (
    <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-header">
        <div className="chatbot-info">
          <div className="chatbot-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="var(--primary-green)" opacity="0.2" />
              <path
                d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
                stroke="var(--primary-green)"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="chatbot-details">
            <h3 className="chatbot-name">{t('chatbot.name')}</h3>
            <span className="chatbot-status">{t('chatbot.status')}</span>
          </div>
        </div>
        <button
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
          aria-label={isMinimized ? t('chatbot.expand') : t('chatbot.minimize')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {isMinimized ? (
              <path d="M5 10l5-5 5 5" stroke="currentColor" strokeWidth="2" fill="none" />
            ) : (
              <path d="M15 10l-5 5-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
            )}
          </svg>
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            {message.sender === 'bot' && (
              <div className="message-avatar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" fill="var(--primary-green)" opacity="0.2" />
                  <path
                    d="M6 11s1.5 2 4 2 4-2 4-2M7 7h.01M13 7h.01"
                    stroke="var(--primary-green)"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            )}
            <div className="message-content">
              <div className="message-bubble">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" fill="var(--primary-green)" opacity="0.2" />
                <path
                  d="M6 11s1.5 2 4 2 4-2 4-2M7 7h.01M13 7h.01"
                  stroke="var(--primary-green)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div className="message-content">
              <div className="message-bubble typing">
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

      <div className="chatbot-quick-responses">
        {quickResponses.map((response, index) => (
          <button
            key={index}
            className="quick-response-btn"
            onClick={() => handleQuickResponse(response)}
          >
            {response}
          </button>
        ))}
      </div>

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatbot.inputPlaceholder')}
            className="message-input"
            rows="1"
          />
          <button
            onClick={handleSendMessage}
            className="send-btn"
            disabled={!inputValue.trim()}
            aria-label={t('chatbot.sendMessage')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 10l16-8-8 8 8 8-16-8z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
