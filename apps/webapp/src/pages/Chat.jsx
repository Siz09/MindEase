'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import '../styles/Chat.css';
import { apiGet } from '../lib/api';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import useTextToSpeech from '../hooks/useTextToSpeech';
import VoicePlayer from '../components/VoicePlayer';
import { mapI18nToSpeechLang } from '../utils/speechUtils';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  ''
);

const Chat = () => {
  const { t, i18n } = useTranslation();
  const { token, currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [historyPage, setHistoryPage] = useState(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [voiceInputEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved).voiceInputEnabled !== false : true;
  });
  const [voiceOutputEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved).voiceOutputEnabled === true : false;
  });
  const [_voiceStatusText, setVoiceStatusText] = useState(''); // Used in voice conversation mode
  const [isVoiceTranscribed, setIsVoiceTranscribed] = useState(false);
  const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isVoiceConversationActive, setIsVoiceConversationActive] = useState(false);
  const inputRef = useRef(null);
  const userCancelledRecordingRef = useRef(false);
  const manuallyStoppedTTSRef = useRef(false);
  const isStartingRecordingRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const ttsStateRef = useRef({ isPlaying: false, stopSpeech: null });
  const isVoiceConversationActiveRef = useRef(false);
  const lastRecordingStartRef = useRef(0);

  const stompClientRef = useRef(null);
  const isConnectingRef = useRef(false);
  const isIntentionallyDisconnectingRef = useRef(false);
  const processedMessageIds = useRef(new Map());
  const messagesContainerRef = useRef(null);
  const preventAutoScrollRef = useRef(false);
  const prevScrollHeightRef = useRef(null);

  // Shared function to send messages to the server
  const sendMessageToServer = async (messageText) => {
    if (!messageText.trim()) return false;
    if (!stompClientRef.current || !isConnected) {
      toast.error('Not connected to chat. Please refresh the page.');
      return false;
    }

    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
      return false;
    } finally {
      setTimeout(() => {
        setIsTyping(false);
      }, 1500);
    }
  };

  const sendVoiceMessage = async (text) => {
    if (!text || !text.trim()) {
      console.warn('sendVoiceMessage called with empty text');
      return false;
    }

    // Wait for connection if not ready yet (with timeout)
    const waitForConnection = (timeoutMs = 4000) => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const checkConnection = () => {
          if (isConnected && stompClientRef.current) {
            resolve(true);
          } else if (Date.now() - startTime >= timeoutMs) {
            resolve(false);
          } else {
            setTimeout(checkConnection, 200);
          }
        };
        checkConnection();
      });
    };

    const connected = await waitForConnection();

    // Final check before sending
    if (!connected || !stompClientRef.current || !isConnected) {
      console.warn('Voice message not sent: connection not ready after waiting', {
        isConnected,
        hasStompClient: !!stompClientRef.current,
        connected,
      });
      // Keep text in input for retry
      setInputValue(text);
      setIsVoiceTranscribed(true);
      return false;
    }

    try {
      const success = await sendMessageToServer(text);
      if (success) {
        setInputValue('');
        setIsVoiceTranscribed(false);
        return true;
      } else {
        // If sending failed, keep the text in input so user can retry
        console.warn('sendMessageToServer returned false');
        setInputValue(text);
        setIsVoiceTranscribed(true);
        return false;
      }
    } catch (error) {
      console.error('Error in sendVoiceMessage:', error);
      setInputValue(text);
      setIsVoiceTranscribed(true);
      return false;
    }
  };

  // Helper function to interrupt TTS when user starts speaking
  const interruptTTS = () => {
    const { isPlaying, stopSpeech } = ttsStateRef.current;
    if (isVoiceConversationActive && (isPlaying || window.speechSynthesis?.speaking)) {
      if (stopSpeech) stopSpeech();
      setCurrentPlayingMessageId(null);
      setMessageQueue([]);
      // Force cancel any pending TTS synchronously
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const {
    startRecording,
    cancelRecording,
    isRecording,
    isSupported: isVoiceSupported,
    isTranscribing,
  } = useVoiceRecorder({
    language: mapI18nToSpeechLang(i18n.language),
    onStart: () => {
      // Recording has actually started - reset the flag
      isStartingRecordingRef.current = false;
    },
    onInterimResult: (interimText) => {
      // Interrupt TTS as soon as we detect any speech (speech recognition already filters noise)
      if (interimText && interimText.trim().length > 0) {
        interruptTTS();
      }
    },
    onTranscriptionComplete: (text) => {
      if (!text || !text.trim()) {
        // If no text transcribed, just restart listening in voice conversation mode
        // Use ref to get current value
        if (isVoiceConversationActiveRef.current) {
          setTimeout(() => {
            if (
              !isRecording &&
              !isTranscribing &&
              isVoiceConversationActiveRef.current &&
              !isStartingRecordingRef.current
            ) {
              isStartingRecordingRef.current = true;
              startRecording();
              setVoiceStatusText(t('chat.listening'));
            }
          }, 100);
        }
        return;
      }

      setInputValue(text);
      setIsVoiceTranscribed(true);
      setVoiceStatusText('');
      retryCountRef.current = 0; // Reset retry counter on successful transcription

      // Use ref to get current value instead of captured state
      if (isVoiceConversationActiveRef.current) {
        // Send the message (non-blocking) and immediately restart listening
        sendVoiceMessage(text)
          .then((success) => {
            if (!success) {
              console.warn('Voice message sending may have failed, but continuing...');
            }
          })
          .catch((err) => {
            console.error('Failed to send voice message:', err);
            // Keep text in input for retry
            setInputValue(text);
            setIsVoiceTranscribed(true);
          });
        // Restart listening immediately after transcription
        setTimeout(() => {
          if (
            !isRecording &&
            !isTranscribing &&
            isVoiceConversationActiveRef.current &&
            !isStartingRecordingRef.current
          ) {
            isStartingRecordingRef.current = true;
            startRecording();
            setVoiceStatusText(t('chat.listening'));
          }
        }, 100);
      } else {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    },
    onError: (err) => {
      // Don't show toast for 'aborted' errors - they're expected when canceling
      // Also don't show for 'no-speech' errors - they're normal
      if (err && !err.includes('cancelled') && !err.includes('no-speech')) {
        toast.error(err);
      }
      setVoiceStatusText('');
      isStartingRecordingRef.current = false;

      // Restart listening after error in conversation mode (except for aborted/cancelled)
      if (isVoiceConversationActive && err && !err.includes('cancelled')) {
        if (retryCountRef.current >= MAX_RETRIES) {
          toast.error(t('chat.voiceRecordingFailed'));
          setIsVoiceConversationActive(false);
          retryCountRef.current = 0;
          return;
        }
        retryCountRef.current += 1;
        setTimeout(() => {
          if (!isRecording && !isTranscribing && !isStartingRecordingRef.current) {
            isStartingRecordingRef.current = true;
            startRecording();
            setVoiceStatusText(t('chat.listening'));
          }
        }, 500);
      }
    },
    silenceTimeoutMs: 5000,
    maxDurationMs: 60000,
  });

  const {
    speak,
    stop: stopSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    isPlaying,
    isPaused,
    isSupported: isTTSSupported,
  } = useTextToSpeech({
    language: mapI18nToSpeechLang(i18n.language),
    defaultRate: (() => {
      const saved = localStorage.getItem('voiceSettings');
      return saved ? JSON.parse(saved).speechRate || 1.0 : 1.0;
    })(),
    defaultVolume: (() => {
      const saved = localStorage.getItem('voiceSettings');
      return saved ? JSON.parse(saved).volume || 1.0 : 1.0;
    })(),
    onComplete: () => {
      setCurrentPlayingMessageId(null);

      // Play next message in queue if available
      if (messageQueue.length > 0) {
        const nextMessage = messageQueue[0];
        setMessageQueue((prev) => prev.slice(1));
        setCurrentPlayingMessageId(nextMessage.id);
        speak(nextMessage.content);
      }
      // Note: Listening is handled continuously, no need to restart here
    },
    onError: (err) => {
      if (err?.error !== 'interrupted' && err?.error !== 'canceled') {
        console.error('TTS error:', err);
      }
      setCurrentPlayingMessageId(null);

      if (messageQueue.length > 0) {
        const nextMessage = messageQueue[0];
        setMessageQueue((prev) => prev.slice(1));
        setCurrentPlayingMessageId(nextMessage.id);
        speak(nextMessage.content);
      }
    },
  });

  const isVoiceConversationMode =
    voiceInputEnabled && voiceOutputEnabled && isVoiceSupported && isTTSSupported;

  // Update TTS state ref so interruptTTS can access current values
  useEffect(() => {
    ttsStateRef.current = { isPlaying, stopSpeech };
  }, [isPlaying, stopSpeech]);

  // Update voice conversation active ref so WebSocket callback can access current value
  useEffect(() => {
    isVoiceConversationActiveRef.current = isVoiceConversationActive;
  }, [isVoiceConversationActive]);

  // Limit memory growth of processed IDs
  const MAX_PROCESSED_IDS = 1000;
  const trimProcessedIds = () => {
    if (processedMessageIds.current.size > MAX_PROCESSED_IDS) {
      const entries = Array.from(processedMessageIds.current.entries())
        .sort(([, a], [, b]) => b - a) // newest first by timestamp
        .slice(0, MAX_PROCESSED_IDS);
      processedMessageIds.current = new Map(entries);
    }
  };

  const extractTotalPages = (res) =>
    Number.isFinite(res?.pagination?.totalPages)
      ? res.pagination.totalPages
      : Number.isFinite(res?.totalPages)
        ? res.totalPages
        : undefined;

  const normalizeMessage = (m) => {
    const id = m.id;
    if (id) processedMessageIds.current.set(id, Date.now());
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
        m.crisisResources || (m.crisisResourcesJson ? JSON.parse(m.crisisResourcesJson) : []),
      createdAt: m.createdAt || new Date().toISOString(),
      sender: m.sender || (m.isUserMessage ? 'user' : 'bot'),
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // If we're restoring scroll after prepending history
    if (prevScrollHeightRef.current !== null && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
      preventAutoScrollRef.current = false;
      return;
    }
    // Otherwise, auto-scroll unless explicitly prevented
    if (!preventAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Scroll to bottom after initial history load completes
  useEffect(() => {
    if (initialLoadComplete) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [initialLoadComplete]);

  const connectWebSocket = useCallback(() => {
    if (isConnectingRef.current || stompClientRef.current) {
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
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setIsConnected(true);
          isConnectingRef.current = false;
          isIntentionallyDisconnectingRef.current = false; // Reset flag on successful connection

          const userTopic = `/topic/user/${currentUser.id}`;

          client.subscribe(userTopic, (message) => {
            try {
              const parsedMessage = JSON.parse(message.body);
              const messageId = parsedMessage.id;

              if (processedMessageIds.current.has(messageId)) {
                return;
              }

              processedMessageIds.current.set(messageId, Date.now());
              trimProcessedIds();

              // Normalize and keep all safety metadata
              const normalizedMessage = normalizeMessage({
                ...parsedMessage,
                id: messageId,
              });

              setMessages((prev) => [...prev, normalizedMessage]);

              // Only auto-play in voice conversation mode to respect accessibility guidelines
              // Use ref to get current value since this callback captures old values
              if (
                !normalizedMessage.isUserMessage &&
                voiceOutputEnabled &&
                isTTSSupported &&
                isVoiceConversationActiveRef.current
              ) {
                // Reset manually stopped flag when new bot message arrives in voice conversation
                // This allows TTS to play for new messages even if user manually stopped previous one
                manuallyStoppedTTSRef.current = false;

                // In voice conversation mode, always play TTS regardless of scroll position
                // This ensures the user hears the response even if they scrolled up
                const messageContent = normalizedMessage.content?.trim();
                if (messageContent) {
                  // Cancel any currently playing TTS to play the new message
                  if (isPlaying || currentPlayingMessageId || window.speechSynthesis?.speaking) {
                    if (stopSpeech) stopSpeech();
                    if (window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    setCurrentPlayingMessageId(null);
                    setMessageQueue([]);
                  }
                  // Play the new message immediately
                  setCurrentPlayingMessageId(normalizedMessage.id);
                  speak(messageContent);
                }
              }
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });

          // Load existing chat history once connected
          if (historyPage === null && !loadingHistory) {
            loadHistory();
          }
        },

        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          toast.error('Chat connection error');
          isConnectingRef.current = false;
        },

        onDisconnect: () => {
          setIsConnected(false);
          isConnectingRef.current = false;
          // Don't show toast during intentional disconnection (cleanup/unmount)
          if (!isIntentionallyDisconnectingRef.current) {
            toast.info('Disconnected from chat');
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
          }
          isConnectingRef.current = false;
          // Fallback: ensure history loads even if WS fails (only if not disconnecting)
          if (!isCleanup && token && currentUser && historyPage === null) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    token,
    currentUser,
    voiceOutputEnabled,
    isTTSSupported,
    isPlaying,
    currentPlayingMessageId,
    stopSpeech,
    speak,
    historyPage,
    loadingHistory,
  ]);

  // Single WebSocket connection effect
  useEffect(() => {
    if (token && currentUser && !stompClientRef.current && !isConnectingRef.current) {
      connectWebSocket();
    }

    return () => {
      // Set flag first to prevent any error handlers from logging
      isIntentionallyDisconnectingRef.current = true;

      if (stompClientRef.current) {
        const client = stompClientRef.current;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  const loadHistory = async () => {
    if (loadingHistory) return;
    try {
      setLoadingHistory(true);
      const pageSize = 50;
      // Request newest first; reverse to chronological for UI
      const res = await apiGet(`/api/chat/history?page=0&size=${pageSize}&sort=desc`, token);
      const totalPages = extractTotalPages(res) ?? 1;
      const items = Array.isArray(res?.data) ? res.data.slice().reverse() : [];
      const normalized = items.map((m) => normalizeMessage(m));
      trimProcessedIds();
      setMessages((prev) => {
        if (prev.length === 0) return normalized;
        const newIds = new Set(normalized.map((m) => m.id));
        const prevFiltered = prev.filter((m) => !newIds.has(m.id));
        return [...normalized, ...prevFiltered];
      });
      setHistoryPage(0);
      setHasMoreHistory(totalPages > 1);
      setInitialLoadComplete(true);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      toast.error('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fallback: load history when auth becomes available (even before WS connects)
  useEffect(() => {
    if (token && currentUser && historyPage === null) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  // Continuous listening in voice conversation mode
  // This ensures we're always listening when not recording/transcribing
  // Use cooldown to prevent rapid restarts while allowing interruption
  useEffect(() => {
    if (
      isVoiceConversationActive &&
      isConnected &&
      !isRecording &&
      !isTranscribing &&
      !userCancelledRecordingRef.current &&
      !manuallyStoppedTTSRef.current &&
      !isStartingRecordingRef.current
    ) {
      // Add cooldown to prevent rapid restarts
      const now = Date.now();
      const timeSinceLastStart = now - lastRecordingStartRef.current;
      const cooldownPeriod = 800; // 800ms minimum between recordings to prevent echo/feedback

      if (timeSinceLastStart < cooldownPeriod) {
        return;
      }

      // Use longer delay if TTS is playing to reduce chance of audio feedback
      const delay = isPlaying ? 500 : 100;

      const timer = setTimeout(() => {
        // Only start if conditions are still met
        if (
          !isRecording &&
          !isTranscribing &&
          isVoiceConversationActive &&
          !isStartingRecordingRef.current
        ) {
          const timeSinceLastCheck = Date.now() - lastRecordingStartRef.current;
          if (timeSinceLastCheck >= cooldownPeriod) {
            lastRecordingStartRef.current = Date.now();
            isStartingRecordingRef.current = true;
            startRecording();
            setVoiceStatusText(t('chat.listening'));
          }
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [
    isVoiceConversationActive,
    isConnected,
    isRecording,
    isTranscribing,
    isPlaying,
    startRecording,
    t,
  ]);

  const handleScroll = async () => {
    const el = messagesContainerRef.current;
    if (!el || loadingHistory || !hasMoreHistory) return;
    if (el.scrollTop <= 40) {
      await loadOlderHistory();
    }
  };

  const loadOlderHistory = async () => {
    if (historyPage === null) return;
    try {
      setLoadingHistory(true);
      const nextPage = historyPage + 1; // older when using sort=desc on API
      const el = messagesContainerRef.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;
      const res = await apiGet(`/api/chat/history?page=${nextPage}&size=50&sort=desc`, token);
      const totalPages = extractTotalPages(res);
      const items = Array.isArray(res?.data) ? res.data.slice().reverse() : [];
      const normalized = items
        .map((m) => {
          if (processedMessageIds.current.has(m.id)) return null;
          return normalizeMessage(m);
        })
        .filter(Boolean);

      if (normalized.length === 0) {
        setHasMoreHistory(false);
      } else {
        preventAutoScrollRef.current = true; // don't jump to bottom
        prevScrollHeightRef.current = prevScrollHeight; // restore after render
        setMessages((prev) => [...normalized, ...prev]);
        setHistoryPage(nextPage);
        if (typeof totalPages === 'number') {
          setHasMoreHistory(nextPage < totalPages - 1);
        }
        trimProcessedIds();
      }
    } catch (err) {
      console.error('Failed to load older history:', err);
      toast.error('Failed to load older messages');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (isRecording && newValue !== inputValue) {
      cancelRecording();
      setVoiceStatusText('');
    }

    if (isVoiceTranscribed) {
      setIsVoiceTranscribed(false);
    }
  };

  const handlePlayMessage = (messageId, messageText) => {
    if (currentPlayingMessageId === messageId) {
      if (isPaused) {
        resumeSpeech();
      } else {
        pauseSpeech();
      }
    } else {
      stopSpeech();
      setCurrentPlayingMessageId(messageId);
      speak(messageText);
    }
  };

  const handleStopMessage = () => {
    manuallyStoppedTTSRef.current = true;
    stopSpeech();
    setCurrentPlayingMessageId(null);
    setMessageQueue([]);
  };

  const handleToggleVoiceConversation = () => {
    if (isVoiceConversationActive) {
      setIsVoiceConversationActive(false);
      isStartingRecordingRef.current = false;
      if (isRecording) {
        cancelRecording();
      }
      if (isPlaying) {
        stopSpeech();
        setCurrentPlayingMessageId(null);
      }
      setMessageQueue([]);
      setVoiceStatusText('');
      toast.info(t('chat.voiceConversationStopped'));
    } else {
      if (!isVoiceConversationMode) {
        toast.error(t('chat.enableVoiceInSettings'));
        return;
      }
      if (!isConnected) {
        toast.error('Please wait for connection before starting voice conversation');
        return;
      }
      setIsVoiceConversationActive(true);
      retryCountRef.current = 0; // Reset retry counter for new conversation
      userCancelledRecordingRef.current = false;
      manuallyStoppedTTSRef.current = false;
      isStartingRecordingRef.current = true;
      startRecording();
      setVoiceStatusText(t('chat.listening'));
      toast.success(t('chat.voiceConversationStarted'));
    }
  };

  const sendMessage = async (messageOverride) => {
    const textToSend = (messageOverride ?? inputValue)?.trim();
    if (!textToSend) {
      return;
    }

    const success = await sendMessageToServer(textToSend);
    if (success) {
      setInputValue('');
      setIsVoiceTranscribed(false);
      toast.success('Message sent successfully');
    } else if (messageOverride) {
      setInputValue(messageOverride);
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

  const renderRiskLabel = (message) => {
    if (!message || !message.riskLevel || message.riskLevel === 'NONE') return null;
    // Simple, non-intrusive inline label using inline styles to avoid CSS changes
    const label = `Risk: ${message.riskLevel.toUpperCase()}`;
    const color =
      message.riskLevel === 'CRITICAL'
        ? '#b91c1c'
        : message.riskLevel === 'HIGH'
          ? '#dc2626'
          : message.riskLevel === 'MEDIUM'
            ? '#d97706'
            : '#2563eb';
    return (
      <div style={{ marginTop: 4, fontSize: '0.75rem', fontWeight: 500, color }}>
        {label}
        {message.moderationAction && message.moderationAction !== 'NONE'
          ? ` • Action: ${message.moderationAction.toLowerCase()}`
          : null}
      </div>
    );
  };

  const renderModerationNote = (message) => {
    if (!message || !message.moderationReason) return null;
    return (
      <div style={{ marginTop: 2, fontSize: '0.7rem', color: '#6b7280' }}>
        {message.moderationReason}
      </div>
    );
  };

  const renderCrisisResources = (message) => {
    if (
      !message ||
      !Array.isArray(message.crisisResources) ||
      message.crisisResources.length === 0
    ) {
      return null;
    }
    return (
      <div
        style={{
          marginTop: 6,
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          backgroundColor: 'rgba(254, 226, 226, 0.6)',
          border: '1px solid #fecaca',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 2 }}>
          {t('chat.crisisResourcesTitle') || 'Crisis support contacts near you:'}
        </div>
        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, fontSize: '0.75rem' }}>
          {message.crisisResources.map((r) => (
            <li
              key={`${r.region || ''}-${r.name || ''}-${r.phoneNumber || ''}`}
              style={{ marginTop: 2 }}
            >
              {r.name && <span style={{ fontWeight: 500 }}>{r.name}</span>}
              {r.phoneNumber && <span> • {r.phoneNumber}</span>}
              {r.website && (
                <span>
                  {' '}
                  •{' '}
                  <a href={r.website} target="_blank" rel="noreferrer">
                    {new URL(r.website).hostname.replace(/^www\./, '')}
                  </a>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="page chat-page">
      <div className="container">
        <div className="chat-container">
          <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
            {loadingHistory && (
              <div className="loading-history">
                <div className="loading-spinner"></div>
                <span>{t('chat.loadingOlderMessages') || 'Loading older messages...'}</span>
              </div>
            )}
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
                      onClick={() => sendMessage(t('chat.quickResponses.anxiety'))}
                    >
                      {t('chat.quickResponses.anxiety')}
                    </button>
                    <button
                      className="suggested-message"
                      onClick={() => sendMessage(t('chat.quickResponses.relax'))}
                    >
                      {t('chat.quickResponses.relax')}
                    </button>
                    <button
                      className="suggested-message"
                      onClick={() => sendMessage(t('chat.quickResponses.motivation'))}
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
                      {/* Visible safety / risk info inside the bubble, without changing layout classes */}
                      {renderRiskLabel(message)}
                      {renderModerationNote(message)}
                      {renderCrisisResources(message)}
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
                      {!message.isUserMessage && voiceOutputEnabled && isTTSSupported && (
                        <VoicePlayer
                          compact
                          isPlaying={currentPlayingMessageId === message.id && isPlaying}
                          isPaused={currentPlayingMessageId === message.id && isPaused}
                          onPlay={() => handlePlayMessage(message.id, message.content)}
                          onPause={() => pauseSpeech()}
                          onStop={handleStopMessage}
                        />
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
              {isVoiceConversationMode && (
                <button
                  className={`voice-conversation-toggle ${isVoiceConversationActive ? 'active' : ''}`}
                  onClick={handleToggleVoiceConversation}
                  title={
                    isVoiceConversationActive
                      ? t('chat.stopVoiceConversation')
                      : t('chat.startVoiceConversation')
                  }
                >
                  {isVoiceConversationActive ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="6" width="12" height="12" fill="currentColor" rx="2" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M19 10v2a7 7 0 0 1-14 0v-2"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path d="M12 19v3m-4 0h8" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              )}
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.inputPlaceholder')}
                className={`chat-input ${isVoiceTranscribed ? 'chat-input--voice-transcribed' : ''}`}
                rows="1"
                disabled={!isConnected || isTranscribing}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || !isConnected || isTranscribing}
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
