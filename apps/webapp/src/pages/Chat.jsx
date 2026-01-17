'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Send, Mic, Bot } from 'lucide-react';
import '../styles/Chat.css';
import '../styles/chat-timers.css';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import { detectIntent, getIntentResponseText } from '../utils/chatIntentDetection';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { useWebSocket } from '../hooks/useWebSocket';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatHistory } from '../hooks/useChatHistory';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import VoicePlayer from '../components/VoicePlayer';
import VoiceModeTutorial from '../components/VoiceModeTutorial';
import ChatBubble from '../components/ui/ChatBubble';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Alert, { AlertIndicator } from '../components/ui/Alert';
import { mapI18nToSpeechLang, splitTextForTTS } from '../utils/speechUtils';
import { trackRecordingError, trackTTSStarted, trackTTSError } from '../utils/voiceAnalytics';
import {
  MESSAGE_STATUS,
  getStatusIcon,
  getStatusColor,
  getStatusText,
} from '../utils/messageStatus';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  ''
);

const Chat = () => {
  const { t, i18n } = useTranslation();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();

  // Declare all refs first (before hooks that use them)
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const manuallyStoppedTTSRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const ttsStateRef = useRef({ isPlaying: false, stopSpeech: null });
  const lastBotMessageRef = useRef(null);
  const ttsVolumeRef = useRef(1.0);
  const messageQueueRef = useRef([]);
  const messagesContainerRef = useRef(null);
  const preventAutoScrollRef = useRef(false);
  const prevScrollHeightRef = useRef(null);
  const wsConnectedRef = useRef(false);
  const isVoiceConversationActiveRef = useRef(false);
  const skipBotResponseRef = useRef(false);

  // Declare all state before hooks that use them
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved).voiceInputEnabled !== false : true;
  });
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved).voiceOutputEnabled === true : false;
  });
  const [_voiceStatusText, setVoiceStatusText] = useState('');
  const [isVoiceTranscribed, setIsVoiceTranscribed] = useState(false);
  const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);
  // Interactive message state (for breathing/meditation timers)
  const [interactiveStates, setInteractiveStates] = useState({});

  // Chat messages hook
  const {
    messages,
    messageStatuses,
    setMessages,
    addMessage,
    addMessages,
    removeMessage,
    updateMessageStatus,
    markMessageSent,
    markMessageDelivered,
    normalizeMessage,
    trimMessages,
    isMessageProcessed,
    processedMessageIds,
  } = useChatMessages();

  // Chat history hook - now supports chatId for multi-chat
  const {
    historyPage,
    hasMoreHistory,
    loadingHistory,
    initialLoadComplete,
    currentSessionId,
    loadHistory,
    loadOlderHistory,
  } = useChatHistory({
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
  });

  // Define scrollToBottom early so it can be used in sendMessageToServer
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Ref for sendMessageToServer to break circular dependency with useOfflineQueue
  const sendMessageToServerRef = useRef(null);

  // Offline queue hook - needs to be before sendMessageToServer but uses ref for circular dep
  const {
    offlineQueueCount,
    addToQueue,
    processQueue: processOfflineQueue,
  } = useOfflineQueue({
    isOnline,
    isConnected: wsConnectedRef.current,
    sendMessage: (msg) => sendMessageToServerRef.current?.(msg),
  });

  // Shared function to send messages to the server
  const sendMessageToServer = useCallback(
    async (messageText, options = {}) => {
      if (!messageText.trim()) return false;

      // If offline, queue the message
      if (!isOnline) {
        addToQueue(messageText);
        toast.info('Message queued. Will send when online.');
        return false;
      }

      if (!wsConnectedRef.current) {
        // Queue message if WebSocket is not connected but we're online
        addToQueue(messageText);
        toast.warning('Not connected. Message queued.');
        return false;
      }

      // Don't add optimistic message - let WebSocket handle it
      // This prevents duplicate messages

      setIsTyping(true);

      try {
        // Use chatId from URL params or currentSessionId from history hook
        const sessionIdToUse = chatId || currentSessionId;

        const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: messageText,
            sessionId: sessionIdToUse, // Include sessionId for multi-chat support
            skipAIResponse: options.skipAIResponse || false, // Flag to skip AI response
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to send message');
        }

        // Messages should come via WebSocket, but add fallback if WebSocket isn't working
        const userMessage = result.data?.userMessage;
        const botMessage = result.data?.botMessage;

        // Fallback: If WebSocket isn't connected, add messages directly from HTTP response
        if (!wsConnectedRef.current) {
          console.warn('⚠️ WebSocket not connected, adding messages from HTTP response');
          if (userMessage) {
            addMessage(userMessage);
          }
          if (botMessage) {
            addMessage(botMessage);
            setTimeout(() => scrollToBottom(), 100);
          }
        }

        // Mark user message as sent
        const realMessageId = userMessage?.id;
        if (realMessageId) {
          markMessageSent(realMessageId);
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
    },
    [
      isOnline,
      token,
      chatId,
      currentSessionId,
      addMessage,
      markMessageSent,
      scrollToBottom,
      addToQueue,
    ]
  );

  // Update ref when sendMessageToServer changes (for circular dependency with useOfflineQueue)
  useEffect(() => {
    sendMessageToServerRef.current = sendMessageToServer;
  }, [sendMessageToServer]);

  // Wrapper for sending voice messages (waits for connection)
  const sendVoiceMessage = useCallback(
    async (text) => {
      if (!text || !text.trim()) {
        console.warn('sendVoiceMessage called with empty text');
        return false;
      }

      // Wait for connection if not ready yet (with timeout)
      const waitForConnection = (timeoutMs = 4000) => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          const checkConnection = () => {
            if (wsConnectedRef.current) {
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
      if (!connected || !wsConnectedRef.current) {
        console.warn('Voice message not sent: connection not ready after waiting', {
          isConnected: wsConnectedRef.current,
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
    },
    [sendMessageToServer, setInputValue, setIsVoiceTranscribed]
  );

  // Refs to store voice conversation callbacks (set after hook initialization)
  const voiceConversationCallbacksRef = useRef({
    handleInterimTranscription: null,
    handleTranscription: null,
    onStart: null,
  });

  const {
    startRecording,
    cancelRecording,
    isRecording,
    isSupported: isVoiceSupported,
    isTranscribing,
    interimTranscript,
  } = useVoiceRecorder({
    language: mapI18nToSpeechLang(i18n.language),
    onStart: () => {
      // Recording has actually started - reset the flag
      if (voiceConversationCallbacksRef.current.onStart) {
        voiceConversationCallbacksRef.current.onStart();
      }
    },
    onInterimResult: (interimText) => {
      // Interrupt TTS as soon as we detect any speech
      if (voiceConversationCallbacksRef.current.handleInterimTranscription) {
        voiceConversationCallbacksRef.current.handleInterimTranscription(interimText);
      }
    },
    onTranscriptionComplete: (text) => {
      // Handle transcription via voice conversation hook
      if (voiceConversationCallbacksRef.current.handleTranscription) {
        voiceConversationCallbacksRef.current.handleTranscription(text);
        return;
      }

      // Fallback to old logic if hook not initialized yet
      if (!text || !text.trim()) {
        return;
      }

      setInputValue(text);
      setIsVoiceTranscribed(true);
      setVoiceStatusText('');
      retryCountRef.current = 0;

      // Auto-send message after 2 second delay
      setTimeout(() => {
        sendVoiceMessage(text);
      }, 2000);

      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    onError: (err) => {
      // Don't show toast for 'aborted' errors - they're expected when canceling
      // Also don't show for 'no-speech' errors - they're normal
      if (err && !err.includes('cancelled') && !err.includes('no-speech')) {
        toast.error(err);
        // Track recording errors
        trackRecordingError(err, 'recognition_error');
      }
      setVoiceStatusText('');
      isStartingRecordingRef.current = false;

      // Restore TTS volume if ducking was active (audio ducking)
      if (isDuckingRef.current) {
        setTTSVolume(originalTTSVolumeRef.current);
        isDuckingRef.current = false;
      }

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
    clearQueue: clearTTSQueue,
    volume: ttsVolume,
    setVolume: setTTSVolume,
    rate: ttsRate,
    setRate: setTTSRate,
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
      // Play next chunk/message in queue if available
      // Use ref to get current queue value instead of closure
      const currentQueue = messageQueueRef.current;
      if (currentQueue.length > 0) {
        const nextItem = currentQueue[0];
        setMessageQueue((prev) => prev.slice(1));
        setCurrentPlayingMessageId(nextItem.id);
        speak(nextItem.content);
      } else {
        // No more items in queue, clear playing message ID
        setCurrentPlayingMessageId(null);
      }
      // Note: Listening is handled continuously, no need to restart here
    },
    onError: (err) => {
      if (err?.error !== 'interrupted' && err?.error !== 'canceled') {
        console.error('TTS error:', err);
        trackTTSError(err?.error || err?.message || 'Unknown TTS error');
      }

      // Try to play next chunk/message in queue if available
      // Use ref to get current queue value instead of closure
      const currentQueue = messageQueueRef.current;
      if (currentQueue.length > 0) {
        const nextItem = currentQueue[0];
        setMessageQueue((prev) => prev.slice(1));
        setCurrentPlayingMessageId(nextItem.id);
        speak(nextItem.content);
      } else {
        setCurrentPlayingMessageId(null);
      }
    },
  });

  const isVoiceConversationMode =
    voiceInputEnabled && voiceOutputEnabled && isVoiceSupported && isTTSSupported;

  // Update TTS state ref so interruptTTS can access current values
  useEffect(() => {
    ttsStateRef.current = { isPlaying, stopSpeech };
  }, [isPlaying, stopSpeech]);

  // Update TTS volume ref to avoid stale closures
  useEffect(() => {
    ttsVolumeRef.current = ttsVolume;
  }, [ttsVolume]);

  // Update message queue ref to avoid stale closures in TTS callbacks
  useEffect(() => {
    messageQueueRef.current = messageQueue;
  }, [messageQueue]);

  // Message handler for WebSocket messages
  const handleWebSocketMessage = useCallback(
    (parsedMessage) => {
      const messageId = parsedMessage.id;
      const messageSessionId = parsedMessage.sessionId;

      // Filter messages by sessionId - only show messages for the current chat
      // Use chatId from URL params or currentSessionId from history hook
      const activeSessionId = chatId || currentSessionId;
      if (activeSessionId && messageSessionId && messageSessionId !== activeSessionId) {
        // Message is for a different chat session, ignore it
        console.log(
          'Ignoring message for different session:',
          messageSessionId,
          'current:',
          activeSessionId
        );
        return;
      }

      // Skip bot responses when we're showing interactive component instead
      if (!parsedMessage.isUserMessage && skipBotResponseRef.current) {
        console.log('Skipping bot response - showing interactive component instead');
        skipBotResponseRef.current = false;
        return;
      }

      // Add message (hook handles deduplication)
      const wasAdded = addMessage(parsedMessage);
      if (!wasAdded) {
        return; // Message was duplicate, skip processing
      }

      // Get normalized message for further processing
      const normalizedMessage = normalizeMessage(parsedMessage);

      // Mark message as delivered if it's from the server
      if (normalizedMessage.isUserMessage) {
        markMessageDelivered(messageId);
      }

      // Store last bot message for repeat command
      if (!normalizedMessage.isUserMessage) {
        lastBotMessageRef.current = normalizedMessage;
      }

      // Ensure scroll happens for new messages (especially bot messages)
      if (!normalizedMessage.isUserMessage) {
        // Small delay to ensure DOM has updated
        setTimeout(() => {
          preventAutoScrollRef.current = false;
          scrollToBottom();
        }, 100);
      }

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
            clearTTSQueue();
          }

          // Split long messages into TTS-safe chunks
          const chunks = splitTextForTTS(messageContent);
          if (chunks.length > 1) {
            // Queue all chunks for sequential playback
            setCurrentPlayingMessageId(normalizedMessage.id);
            trackTTSStarted(messageContent.length);
            // Play first chunk immediately
            speak(chunks[0]);
            // Queue remaining chunks
            for (let i = 1; i < chunks.length; i++) {
              // Use addToQueue from TTS hook if available, otherwise use messageQueue
              // For now, we'll use the TTS hook's queue via speak calls in onComplete
              // Store chunks in messageQueue for sequential playback
              setMessageQueue((prev) => [
                ...prev,
                { id: normalizedMessage.id, content: chunks[i], chunkIndex: i },
              ]);
            }
          } else {
            // Single chunk, play immediately
            setCurrentPlayingMessageId(normalizedMessage.id);
            trackTTSStarted(messageContent.length);
            speak(messageContent);
          }
        }
      }
    },
    [
      chatId,
      currentSessionId,
      addMessage,
      normalizeMessage,
      markMessageDelivered,
      voiceOutputEnabled,
      isTTSSupported,
      isPlaying,
      currentPlayingMessageId,
      stopSpeech,
      speak,
      clearTTSQueue,
      splitTextForTTS,
      scrollToBottom,
    ]
  );

  // Typing indicator handler
  const handleTypingIndicator = useCallback((isTypingValue) => {
    setIsTyping(isTypingValue);
  }, []);

  // WebSocket hook - handles connection, reconnection, and subscriptions
  const { isConnected: wsConnected, reconnectAttempts } = useWebSocket({
    token,
    currentUser,
    isOnline,
    onMessage: handleWebSocketMessage,
    onTyping: handleTypingIndicator,
    processOfflineQueue,
    loadHistory,
    historyPage,
    loadingHistory,
  });

  // Update ref when connection status changes
  useEffect(() => {
    wsConnectedRef.current = wsConnected;
  }, [wsConnected]);

  // Voice conversation hook (called after useWebSocket to get wsConnected)
  const {
    isVoiceConversationActive,
    showVoiceTutorial,
    setIsVoiceConversationActive,
    setShowVoiceTutorial,
    toggleVoiceConversation,
    handleTranscription,
    handleInterimTranscription,
    interruptTTS,
    isStartingRecordingRef,
    isDuckingRef,
    originalTTSVolumeRef,
    voiceModeStartTimeRef,
  } = useVoiceConversation({
    isVoiceInputEnabled: voiceInputEnabled,
    wsConnected,
    sendMessage: sendVoiceMessage,
    recorder: {
      startRecording,
      cancelRecording,
      isRecording,
      isTranscribing,
    },
    isPlaying,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    speak,
    clearTTSQueue,
    setCurrentPlayingMessageId,
    setMessageQueue,
    setInputValue,
    setIsVoiceTranscribed,
    setVoiceStatusText,
    setTTSVolume,
    setTTSRate,
    ttsRate,
    ttsVolume,
    lastBotMessageRef,
  });

  // Update the ref when voice conversation state changes (for use in handleWebSocketMessage)
  useEffect(() => {
    isVoiceConversationActiveRef.current = isVoiceConversationActive;
  }, [isVoiceConversationActive]);

  // Make voice settings reactive - listen for changes from Settings page
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'voiceSettings' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          setVoiceInputEnabled(settings.voiceInputEnabled !== false);
          setVoiceOutputEnabled(settings.voiceOutputEnabled === true);
        } catch (err) {
          console.error('Error parsing voice settings:', err);
        }
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (from same tab)
    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('voiceSettings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setVoiceInputEnabled(settings.voiceInputEnabled !== false);
          setVoiceOutputEnabled(settings.voiceOutputEnabled === true);
        } catch (err) {
          console.error('Error parsing voice settings:', err);
        }
      }
    };

    // Listen for custom event that Settings page can dispatch
    window.addEventListener('voiceSettingsChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('voiceSettingsChanged', handleCustomStorageChange);
    };
  }, []);

  // Visibility change handling is now in useVoiceConversation hook

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

  // Continuous listening is now handled in useVoiceConversation hook

  const handleScroll = async () => {
    const el = messagesContainerRef.current;
    if (!el || loadingHistory || !hasMoreHistory) return;
    if (el.scrollTop <= 40) {
      await loadOlderHistory();
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

  // Handle selecting a breathing pattern
  const handleSelectBreathingPattern = useCallback(
    (messageId, patternKey, patternData) => {
      // Update the message to show the timer instead of selector
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, interactiveType: 'breathing-timer' } : msg
        )
      );
      // Store the selected pattern in interactive state
      setInteractiveStates((prev) => ({
        ...prev,
        [messageId]: { selectedPattern: patternKey, patternData },
      }));
    },
    [setMessages]
  );

  // Handle timer completion
  const handleTimerComplete = useCallback(
    (messageId, timerType, data) => {
      toast.success(
        timerType === 'breathing'
          ? t('mindfulness.breathing.completed', 'Breathing exercise completed!')
          : t('mindfulness.meditation.completed', 'Meditation session completed!')
      );
      // Optionally dismiss the interactive content
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, interactiveType: null, interactiveCompleted: true } : msg
        )
      );
    },
    [setMessages, t]
  );

  // Handle dismissing interactive content
  const handleDismissInteractive = useCallback(
    (messageId) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, interactiveType: null } : msg))
      );
      setInteractiveStates((prev) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
    },
    [setMessages]
  );

  // Create interactive bot message for breathing/meditation
  const createInteractiveMessage = useCallback(
    (intentType) => {
      const interactiveMessage = {
        id: `interactive-${Date.now()}`,
        content: getIntentResponseText(intentType),
        isUserMessage: false,
        createdAt: new Date().toISOString(),
        interactiveType: intentType === 'breathing' ? 'breathing-selector' : 'meditation-timer',
      };
      addMessage(interactiveMessage);
      setTimeout(() => scrollToBottom(), 100);
    },
    [addMessage, scrollToBottom]
  );

  const sendMessage = async (messageOverride) => {
    const textToSend = (messageOverride ?? inputValue)?.trim();
    if (!textToSend) {
      return;
    }

    // Check for breathing/meditation intent before sending to server
    const intent = detectIntent(textToSend);
    const hasIntent = intent.type && intent.confidence >= 0.7;

    // If intent detected, set flag to skip the next bot response
    if (hasIntent) {
      skipBotResponseRef.current = true;
    }

    // Send message to server for history
    // If intent detected, skip AI response to only show interactive component
    const success = await sendMessageToServer(textToSend, {
      skipAIResponse: hasIntent,
    });

    if (success) {
      setInputValue('');
      setIsVoiceTranscribed(false);

      // If breathing/meditation intent detected, add interactive component
      if (hasIntent) {
        setTimeout(() => {
          createInteractiveMessage(intent.type);
        }, 300); // Small delay for smooth UX
      } else {
        toast.success('Message sent successfully');
      }
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

  return (
    <div
      className="chat-page"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-card)',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Status Indicators - Positioned absolutely */}
      {/* Connection Status Indicator */}
      {!wsConnected && (
        <Alert
          variant={reconnectAttempts.current > 0 ? 'warning' : 'error'}
          style={{
            backgroundColor:
              reconnectAttempts.current > 0 ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
            color:
              reconnectAttempts.current > 0 ? 'var(--color-warning-text)' : 'var(--color-error)',
          }}
        >
          <AlertIndicator
            variant={reconnectAttempts.current > 0 ? 'warning' : 'error'}
            isPulsing={reconnectAttempts.current > 0}
          />
          {reconnectAttempts.current > 0
            ? `Reconnecting... (attempt ${reconnectAttempts.current})`
            : 'Disconnected from chat'}
        </Alert>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <Alert variant="warning">
          <AlertIndicator variant="warning" />
          Offline Mode
          {offlineQueueCount > 0 && (
            <Badge
              variant="warning"
              style={{
                marginLeft: '0.25rem',
                backgroundColor: 'var(--color-warning)',
                color: 'white',
              }}
            >
              {offlineQueueCount} queued
            </Badge>
          )}
        </Alert>
      )}

      {/* Voice Conversation Mode Indicator */}
      {isVoiceConversationActive && (
        <Alert variant="success" style={{ right: '0.5rem', left: 'auto', transform: 'none' }}>
          <AlertIndicator variant="success" isPulsing={isRecording} />
          {isRecording
            ? '🎤 Listening...'
            : isPlaying
              ? '🔊 Speaking...'
              : isTranscribing
                ? '⏳ Processing...'
                : '✓ Voice Mode Active'}
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={toggleVoiceConversation}
            style={{
              marginLeft: '0.5rem',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
            }}
            title="Stop voice conversation"
          >
            Stop
          </Button>
        </Alert>
      )}

      {/* Messages Container - Messenger style */}
      <div
        className="chat-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minHeight: 0,
        }}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loadingHistory && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem 0',
            }}
          >
            <Spinner size={24} style={{ color: 'var(--primary-green)' }} />
            <span
              style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}
            >
              {t('chat.loadingOlderMessages') || 'Loading older messages...'}
            </span>
          </div>
        )}
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem' }}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  style={{ margin: '0 auto' }}
                >
                  <circle cx="32" cy="32" r="28" fill="var(--primary-green)" opacity="0.1" />
                  <path
                    d="M20 32h24M20 24h24M20 40h16"
                    stroke="var(--primary-green)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)',
                }}
              >
                {t('chat.emptyTitle')}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                }}
              >
                {t('chat.emptyDescription')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(t('chat.quickResponses.anxiety'))}
                >
                  {t('chat.quickResponses.anxiety')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(t('chat.quickResponses.relax'))}
                >
                  {t('chat.quickResponses.relax')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(t('chat.quickResponses.motivation'))}
                >
                  {t('chat.quickResponses.motivation')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              messageStatus={messageStatuses[message.id]}
              onRetry={() => {
                sendMessageToServer(message.content);
                removeMessage(message.id);
              }}
              onPlayVoice={() => handlePlayMessage(message.id, message.content)}
              onPauseVoice={() => pauseSpeech()}
              onStopVoice={handleStopMessage}
              isPlaying={currentPlayingMessageId === message.id && isPlaying}
              isPaused={currentPlayingMessageId === message.id && isPaused}
              voiceEnabled={voiceOutputEnabled && isTTSSupported}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              MESSAGE_STATUS={MESSAGE_STATUS}
              // Interactive content props
              onSelectBreathingPattern={handleSelectBreathingPattern}
              onTimerComplete={handleTimerComplete}
              onDismissInteractive={handleDismissInteractive}
              interactiveState={interactiveStates[message.id]}
            />
          ))
        )}
        {isTyping && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <div
                style={{
                  height: '0.5rem',
                  width: '0.5rem',
                  backgroundColor: 'var(--gray-400)',
                  borderRadius: '50%',
                  animation: 'typing 1.4s infinite ease-in-out',
                  animationDelay: '0ms',
                }}
              ></div>
              <div
                style={{
                  height: '0.5rem',
                  width: '0.5rem',
                  backgroundColor: 'var(--gray-400)',
                  borderRadius: '50%',
                  animation: 'typing 1.4s infinite ease-in-out',
                  animationDelay: '150ms',
                }}
              ></div>
              <div
                style={{
                  height: '0.5rem',
                  width: '0.5rem',
                  backgroundColor: 'var(--gray-400)',
                  borderRadius: '50%',
                  animation: 'typing 1.4s infinite ease-in-out',
                  animationDelay: '300ms',
                }}
              ></div>
            </div>
            <span>AI is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Messenger/Instagram style */}
      <div
        style={{
          borderTop: '1px solid var(--gray-300)',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-card)',
          flexShrink: 0,
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                interimTranscript && isRecording ? interimTranscript : t('chat.inputPlaceholder')
              }
              disabled={!wsConnected || isTranscribing}
              rows={1}
            />
            {interimTranscript && isRecording && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: 'var(--spacing-xs)',
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-success)',
                  fontStyle: 'italic',
                  maxHeight: '60px',
                  overflow: 'auto',
                }}
              >
                <span className="font-medium mr-1">Listening:</span>
                {interimTranscript}
              </div>
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            variant="primary"
            disabled={!inputValue.trim() || !wsConnected || isTranscribing}
            style={{ backgroundColor: 'var(--primary-green)' }}
          >
            <Send className="h-4 w-4" />
          </Button>
          {isVoiceConversationMode && (
            <Button
              type="button"
              size="icon"
              variant={isVoiceConversationActive ? 'danger' : 'outline'}
              onClick={toggleVoiceConversation}
              title={
                isVoiceConversationActive
                  ? t('chat.stopVoiceConversation')
                  : t('chat.startVoiceConversation')
              }
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
      <VoiceModeTutorial
        isOpen={showVoiceTutorial}
        onClose={() => {
          setShowVoiceTutorial(false);
          // Start voice mode after tutorial is closed
          // The hook will handle the actual start logic
          toggleVoiceConversation();
        }}
        onDontShowAgain={() => {
          localStorage.setItem('voiceTutorialSeen', 'true');
        }}
      />
    </div>
  );
};

export default Chat;
