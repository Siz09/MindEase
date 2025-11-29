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
import VoiceModeTutorial from '../components/VoiceModeTutorial';
import {
  mapI18nToSpeechLang,
  requestMicrophonePermission,
  splitTextForTTS,
} from '../utils/speechUtils';
import { detectVoiceCommand, isVoiceCommand } from '../utils/voiceCommands';
import {
  trackVoiceModeStarted,
  trackVoiceModeStopped,
  trackRecordingStarted,
  trackRecordingCompleted,
  trackRecordingError,
  trackTranscriptionComplete,
  trackTTSStarted,
  trackTTSCompleted,
  trackTTSError,
  trackVoiceCommand,
  trackPermissionDenied,
} from '../utils/voiceAnalytics';
import LRUCache from '../utils/lruCache';
import {
  MESSAGE_STATUS,
  getStatusIcon,
  getStatusColor,
  getStatusText,
} from '../utils/messageStatus';
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  getOfflineQueueCount,
} from '../utils/offlineQueue';

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
  const [messageStatuses, setMessageStatuses] = useState({}); // Track delivery status by message ID
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(getOfflineQueueCount());
  const [historyPage, setHistoryPage] = useState(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [voiceInputEnabled, setVoiceInputEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved).voiceInputEnabled !== false : true;
  });
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved).voiceOutputEnabled === true : false;
  });
  const [_voiceStatusText, setVoiceStatusText] = useState(''); // Used in voice conversation mode
  const [isVoiceTranscribed, setIsVoiceTranscribed] = useState(false);
  const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isVoiceConversationActive, setIsVoiceConversationActive] = useState(false);
  const [showVoiceTutorial, setShowVoiceTutorial] = useState(false);
  const inputRef = useRef(null);
  const userCancelledRecordingRef = useRef(false);
  const manuallyStoppedTTSRef = useRef(false);
  const isStartingRecordingRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const ttsStateRef = useRef({ isPlaying: false, stopSpeech: null });
  const isVoiceConversationActiveRef = useRef(false);
  const lastRecordingStartRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const originalTTSVolumeRef = useRef(1.0);
  const isDuckingRef = useRef(false);
  const lastBotMessageRef = useRef(null); // Store last bot message for repeat command
  const voiceModeStartTimeRef = useRef(null); // Track voice mode start time for analytics

  const stompClientRef = useRef(null);
  const isConnectingRef = useRef(false);
  const isIntentionallyDisconnectingRef = useRef(false);
  const processedMessageIds = useRef(new LRUCache(1000)); // LRU cache with max 1000 entries
  const messagesContainerRef = useRef(null);
  const preventAutoScrollRef = useRef(false);
  const prevScrollHeightRef = useRef(null);
  const subscriptionsRef = useRef([]); // Track all subscriptions for cleanup

  // Reconnection backoff state
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
  const BASE_RECONNECT_DELAY = 1000; // Start with 1 second

  // Memory management: limit messages in memory to prevent memory leaks
  const MAX_MESSAGES_IN_MEMORY = 200; // Keep last 200 messages in memory

  // Shared function to send messages to the server
  const sendMessageToServer = async (messageText) => {
    if (!messageText.trim()) return false;

    // If offline, queue the message
    if (!isOnline) {
      const queueId = addToOfflineQueue(messageText);
      setOfflineQueueCount(getOfflineQueueCount());
      toast.info('Message queued. Will send when online.');
      return false;
    }

    if (!stompClientRef.current || !isConnected) {
      // Queue message if WebSocket is not connected but we're online
      const queueId = addToOfflineQueue(messageText);
      setOfflineQueueCount(getOfflineQueueCount());
      toast.warning('Not connected. Message queued.');
      return false;
    }

    // Don't add optimistic message - let WebSocket handle it
    // This prevents duplicate messages

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

      // Message will be added via WebSocket, just mark as sent
      const realMessageId = result.data?.userMessage?.id;
      if (realMessageId) {
        setMessageStatuses((prev) => {
          // Don't regress from DELIVERED to SENT
          if (prev[realMessageId] === MESSAGE_STATUS.DELIVERED) {
            return prev;
          }
          return { ...prev, [realMessageId]: MESSAGE_STATUS.SENT };
        });
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
  // Fixed: Use refs instead of closure values to get fresh state
  const interruptTTS = () => {
    const { isPlaying, stopSpeech } = ttsStateRef.current;
    // Use ref to get current value instead of closure
    if (isVoiceConversationActiveRef.current && (isPlaying || window.speechSynthesis?.speaking)) {
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
    interimTranscript,
  } = useVoiceRecorder({
    language: mapI18nToSpeechLang(i18n.language),
    onStart: () => {
      // Recording has actually started - reset the flag
      isStartingRecordingRef.current = false;
    },
    onInterimResult: (interimText) => {
      // Interrupt TTS as soon as we detect any speech (speech recognition already filters noise)
      if (interimText && interimText.trim().length > 0) {
        // Implement audio ducking: reduce TTS volume instead of hard stop
        if (isPlaying && !isDuckingRef.current && isVoiceConversationActiveRef.current) {
          originalTTSVolumeRef.current = ttsVolume;
          setTTSVolume(ttsVolume * 0.3); // Reduce to 30% of original volume
          isDuckingRef.current = true;
        }
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

      // Check for voice commands first
      const command = detectVoiceCommand(text);
      const isCommand = isVoiceCommand(text);

      if (isCommand && command && isVoiceConversationActiveRef.current) {
        // Track voice command usage
        trackVoiceCommand(command);
        // Execute voice command
        let commandExecuted = false;
        switch (command) {
          case 'stop':
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
            clearTTSQueue();
            setVoiceStatusText('');
            toast.info(t('chat.voiceConversationStopped'));
            commandExecuted = true;
            break;

          case 'pause':
            if (isPlaying) {
              pauseSpeech();
              toast.info(t('chat.ttsPaused') || 'Speech paused');
              commandExecuted = true;
            }
            break;

          case 'resume':
            if (isPaused) {
              resumeSpeech();
              toast.info(t('chat.ttsResumed') || 'Speech resumed');
              commandExecuted = true;
            }
            break;

          case 'repeat':
            if (lastBotMessageRef.current) {
              stopSpeech();
              setCurrentPlayingMessageId(lastBotMessageRef.current.id);
              speak(lastBotMessageRef.current.content);
              toast.info(t('chat.repeating') || 'Repeating last message');
              commandExecuted = true;
            } else {
              toast.info(t('chat.noMessageToRepeat') || 'No message to repeat');
            }
            break;

          case 'slower': {
            const newSlowerRate = Math.max(0.1, ttsRate - 0.1);
            setTTSRate(newSlowerRate);
            toast.info(t('chat.speedReduced') || `Speed: ${newSlowerRate.toFixed(1)}x`);
            commandExecuted = true;
            break;
          }

          case 'faster': {
            const newFasterRate = Math.min(2.0, ttsRate + 0.1);
            setTTSRate(newFasterRate);
            toast.info(t('chat.speedIncreased') || `Speed: ${newFasterRate.toFixed(1)}x`);
            commandExecuted = true;
            break;
          }

          case 'louder': {
            const newLouderVolume = Math.min(1.0, ttsVolume + 0.1);
            setTTSVolume(newLouderVolume);
            toast.info(
              t('chat.volumeIncreased') || `Volume: ${Math.round(newLouderVolume * 100)}%`
            );
            commandExecuted = true;
            break;
          }

          case 'quieter': {
            const newQuieterVolume = Math.max(0.1, ttsVolume - 0.1);
            setTTSVolume(newQuieterVolume);
            toast.info(
              t('chat.volumeDecreased') || `Volume: ${Math.round(newQuieterVolume * 100)}%`
            );
            commandExecuted = true;
            break;
          }
        }

        if (commandExecuted) {
          // Restart listening after command execution
          if (isVoiceConversationActiveRef.current && command !== 'stop') {
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
            }, 300);
          }
          return; // Don't process as regular message
        }
      }

      setInputValue(text);
      setIsVoiceTranscribed(true);
      setVoiceStatusText('');
      retryCountRef.current = 0; // Reset retry counter on successful transcription

      // Restore TTS volume after speech ends (audio ducking)
      if (isDuckingRef.current) {
        setTTSVolume(originalTTSVolumeRef.current);
        isDuckingRef.current = false;
      }

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
      if (messageQueue.length > 0) {
        const nextItem = messageQueue[0];
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
      if (messageQueue.length > 0) {
        const nextItem = messageQueue[0];
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

  // Update voice conversation active ref so WebSocket callback can access current value
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

  // Handle visibility change - pause voice mode when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - pause voice mode
        if (isVoiceConversationActive) {
          // Store state to resume later
          if (isRecording) {
            cancelRecording();
          }
          if (isPlaying) {
            stopSpeech();
            setCurrentPlayingMessageId(null);
          }
          // Don't fully stop voice mode, just pause it
          // User can resume when tab becomes visible
          setVoiceStatusText(t('chat.voicePausedHidden') || 'Voice mode paused (tab hidden)');
        }
      } else {
        // Tab became visible - resume voice mode if it was active
        if (isVoiceConversationActive && !isRecording && !isTranscribing) {
          setVoiceStatusText(t('chat.listening'));
          // Restart listening after a short delay
          setTimeout(() => {
            if (
              isVoiceConversationActiveRef.current &&
              !isRecording &&
              !isTranscribing &&
              !isStartingRecordingRef.current
            ) {
              isStartingRecordingRef.current = true;
              startRecording();
            }
          }, 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    isVoiceConversationActive,
    isRecording,
    isTranscribing,
    isPlaying,
    cancelRecording,
    stopSpeech,
    startRecording,
    t,
  ]);

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

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
      setIsOnline(true);
      toast.success('Connection restored');

      // Process offline queue
      processOfflineQueue();
    };

    const handleOffline = () => {
      console.log('Connection lost');
      setIsOnline(false);
      toast.warning('You are offline. Messages will be queued.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process offline message queue
  const processOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued messages...`);
    toast.info(`Sending ${queue.length} queued message${queue.length > 1 ? 's' : ''}...`);

    for (const item of queue) {
      try {
        const success = await sendMessageToServer(item.message);
        if (success) {
          removeFromOfflineQueue(item.id);
          setOfflineQueueCount(getOfflineQueueCount());
        }
      } catch (error) {
        console.error('Error sending queued message:', error);
      }
    }

    const remainingCount = getOfflineQueueCount();
    if (remainingCount === 0) {
      toast.success('All queued messages sent!');
    } else {
      toast.warning(`${remainingCount} message${remainingCount > 1 ? 's' : ''} could not be sent`);
    }
  };

  // Calculate exponential backoff delay
  const getReconnectDelay = () => {
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
      MAX_RECONNECT_DELAY
    );
    return delay;
  };

  // Reset reconnection state on successful connection
  const resetReconnectState = () => {
    reconnectAttempts.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Schedule reconnection with backoff
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      return; // Already scheduled
    }

    const delay = getReconnectDelay();
    reconnectAttempts.current += 1;

    console.log(`Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`);
    toast.info(
      `Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${reconnectAttempts.current})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connectWebSocket();
    }, delay);
  };

  // Trim messages to prevent memory leaks
  const trimMessages = (messagesList) => {
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
  };

  const extractTotalPages = (res) =>
    Number.isFinite(res?.pagination?.totalPages)
      ? res.pagination.totalPages
      : Number.isFinite(res?.totalPages)
        ? res.totalPages
        : undefined;

  const normalizeMessage = (m) => {
    const id = m.id;
    if (id) {
      processedMessageIds.current.set(id, { timestamp: Date.now() });
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
          resetReconnectState(); // Reset backoff on successful connection

          if (reconnectAttempts.current > 0) {
            toast.success('Reconnected successfully!');
          }

          // Process offline queue when reconnected
          if (isOnline && getOfflineQueueCount() > 0) {
            setTimeout(() => processOfflineQueue(), 1000);
          }

          const userTopic = `/topic/user/${currentUser.id}`;

          // Track subscriptions for cleanup
          const messageSubscription = client.subscribe(userTopic, (message) => {
            try {
              const parsedMessage = JSON.parse(message.body);
              const messageId = parsedMessage.id;

              // Check if message was already processed
              if (processedMessageIds.current.has(messageId)) {
                console.debug('Duplicate message detected and skipped:', messageId);
                return;
              }

              // Also check if message with same content already exists in messages array
              // This handles race conditions between HTTP response and WebSocket
              const isDuplicate = messages.some(
                (m) =>
                  m.id === messageId ||
                  (m.content === parsedMessage.content &&
                    m.isUserMessage === parsedMessage.isUserMessage &&
                    Math.abs(new Date(m.createdAt) - new Date(parsedMessage.createdAt)) < 1000)
              );

              if (isDuplicate) {
                console.debug('Duplicate message content detected and skipped:', messageId);
                processedMessageIds.current.set(messageId, { timestamp: Date.now() });
                return;
              }

              processedMessageIds.current.set(messageId, { timestamp: Date.now() });

              // Normalize and keep all safety metadata
              const normalizedMessage = normalizeMessage({
                ...parsedMessage,
                id: messageId,
              });

              setMessages((prev) => trimMessages([...prev, normalizedMessage]));

              // Mark message as delivered if it's from the server
              if (normalizedMessage.isUserMessage) {
                setMessageStatuses((prev) => ({ ...prev, [messageId]: MESSAGE_STATUS.DELIVERED }));
              }

              // Store last bot message for repeat command
              if (!normalizedMessage.isUserMessage) {
                lastBotMessageRef.current = normalizedMessage;
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
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });
          subscriptionsRef.current.push(messageSubscription);

          // Subscribe to typing indicator
          const typingSubscription = client.subscribe(userTopic + '/typing', (message) => {
            try {
              const typingEvent = JSON.parse(message.body);
              setIsTyping(typingEvent.isTyping);
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
          if (historyPage === null && !loadingHistory) {
            loadHistory();
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
              connectWebSocket();
            }, 1000);
          } else {
            toast.error('Chat connection error');
            // Schedule reconnection with backoff for other errors
            scheduleReconnect();
          }
        },

        onDisconnect: () => {
          setIsConnected(false);
          isConnectingRef.current = false;
          // Don't show toast during intentional disconnection (cleanup/unmount)
          if (!isIntentionallyDisconnectingRef.current) {
            toast.info('Disconnected from chat');
            // Schedule reconnection with backoff
            scheduleReconnect();
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
            scheduleReconnect();
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
  // Fixed: Use single timer ref approach to prevent race conditions
  useEffect(() => {
    // Clear any existing timer first
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Early return guard using refs to avoid stale closures
    if (
      !isVoiceConversationActiveRef.current ||
      !isConnected ||
      isRecording ||
      isTranscribing ||
      userCancelledRecordingRef.current ||
      manuallyStoppedTTSRef.current ||
      isStartingRecordingRef.current
    ) {
      return;
    }

    // Add cooldown to prevent rapid restarts
    const now = Date.now();
    const timeSinceLastStart = now - lastRecordingStartRef.current;
    const cooldownPeriod = 350; // 350ms minimum between recordings (reduced from 800ms for better responsiveness)

    if (timeSinceLastStart < cooldownPeriod) {
      // Schedule a check after cooldown period
      const remainingCooldown = cooldownPeriod - timeSinceLastStart;
      recordingTimerRef.current = setTimeout(() => {
        recordingTimerRef.current = null;
        // Trigger effect re-evaluation by checking conditions
        if (
          isVoiceConversationActiveRef.current &&
          isConnected &&
          !isRecording &&
          !isTranscribing &&
          !userCancelledRecordingRef.current &&
          !manuallyStoppedTTSRef.current &&
          !isStartingRecordingRef.current
        ) {
          // Re-check cooldown
          const timeSinceLastCheck = Date.now() - lastRecordingStartRef.current;
          if (timeSinceLastCheck >= cooldownPeriod) {
            lastRecordingStartRef.current = Date.now();
            isStartingRecordingRef.current = true;
            startRecording();
            setVoiceStatusText(t('chat.listening'));
          }
        }
      }, remainingCooldown);
      return () => {
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
    }

    // Use longer delay if TTS is playing to reduce chance of audio feedback
    const delay = isPlaying ? 500 : 100;

    recordingTimerRef.current = setTimeout(() => {
      recordingTimerRef.current = null;
      // Only start if conditions are still met (using refs for fresh values)
      if (
        isVoiceConversationActiveRef.current &&
        isConnected &&
        !isRecording &&
        !isTranscribing &&
        !userCancelledRecordingRef.current &&
        !manuallyStoppedTTSRef.current &&
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

    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
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

  const handleToggleVoiceConversation = async () => {
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
      // Clear both React state queue and TTS hook's internal queue
      setMessageQueue([]);
      clearTTSQueue();
      setVoiceStatusText('');
      // Restore TTS volume if ducking was active
      if (isDuckingRef.current) {
        setTTSVolume(originalTTSVolumeRef.current);
        isDuckingRef.current = false;
      }
      // Track voice mode stopped with duration
      if (voiceModeStartTimeRef.current) {
        const duration = Date.now() - voiceModeStartTimeRef.current;
        trackVoiceModeStopped(duration);
        voiceModeStartTimeRef.current = null;
      }
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

      // Check microphone permission before starting
      const permissionResult = await requestMicrophonePermission();
      if (!permissionResult.granted) {
        let errorMessage = 'Microphone permission is required for voice conversation. ';
        if (permissionResult.error === 'not-allowed') {
          errorMessage += 'Please enable microphone access in your browser settings and try again.';
        } else if (permissionResult.error === 'audio-capture') {
          errorMessage += 'Please connect a microphone and try again.';
        } else if (permissionResult.error === 'not-supported') {
          errorMessage += 'Microphone access is not supported in this browser.';
        } else {
          errorMessage += 'Please check your microphone settings and try again.';
        }
        toast.error(errorMessage);
        return;
      }

      // Check if tutorial should be shown (first time user)
      const hasSeenTutorial = localStorage.getItem('voiceTutorialSeen') === 'true';
      if (!hasSeenTutorial) {
        setShowVoiceTutorial(true);
        // Don't start voice mode yet - wait for user to close tutorial
        return;
      }

      setIsVoiceConversationActive(true);
      voiceModeStartTimeRef.current = Date.now(); // Track start time
      retryCountRef.current = 0; // Reset retry counter for new conversation
      userCancelledRecordingRef.current = false;
      manuallyStoppedTTSRef.current = false;
      isStartingRecordingRef.current = true;
      startRecording();
      setVoiceStatusText(t('chat.listening'));
      toast.success(t('chat.voiceConversationStarted'));
      trackVoiceModeStarted();
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
          {/* Connection Status Indicator */}
          {(!isConnected || reconnectAttempts.current > 0) && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: reconnectAttempts.current > 0 ? '#fef3c7' : '#fee2e2',
                color: reconnectAttempts.current > 0 ? '#92400e' : '#991b1b',
                animation: 'slideDown 0.3s ease-out',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: reconnectAttempts.current > 0 ? '#f59e0b' : '#ef4444',
                  animation: reconnectAttempts.current > 0 ? 'pulse 2s infinite' : 'none',
                }}
              />
              {reconnectAttempts.current > 0
                ? `Reconnecting... (attempt ${reconnectAttempts.current})`
                : 'Disconnected from chat'}
            </div>
          )}

          {/* Offline Indicator */}
          {!isOnline && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1001,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                animation: 'slideDown 0.3s ease-out',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                }}
              />
              Offline Mode
              {offlineQueueCount > 0 && (
                <span
                  style={{
                    marginLeft: '4px',
                    padding: '2px 6px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {offlineQueueCount} queued
                </span>
              )}
            </div>
          )}

          {/* Voice Conversation Mode Indicator */}
          {isVoiceConversationActive && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: '#dcfce7',
                color: '#166534',
                animation: 'slideDown 0.3s ease-out',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  animation: isRecording ? 'pulse 2s infinite' : 'none',
                }}
              />
              {isRecording
                ? '🎤 Listening...'
                : isPlaying
                  ? '🔊 Speaking...'
                  : isTranscribing
                    ? '⏳ Processing...'
                    : '✓ Voice Mode Active'}
              <button
                onClick={handleToggleVoiceConversation}
                style={{
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Stop voice conversation"
              >
                Stop
              </button>
            </div>
          )}

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
                        <>
                          <span
                            className="message-status"
                            style={{
                              color: getStatusColor(messageStatuses[message.id]),
                              fontSize: '0.75rem',
                              marginLeft: '4px',
                            }}
                            title={getStatusText(messageStatuses[message.id])}
                          >
                            {getStatusIcon(messageStatuses[message.id]) || '✓'}
                          </span>
                          {messageStatuses[message.id] === MESSAGE_STATUS.FAILED && (
                            <button
                              onClick={() => {
                                // Retry sending the message
                                sendMessageToServer(message.content);
                                // Remove the failed message
                                setMessages((prev) => prev.filter((m) => m.id !== message.id));
                                setMessageStatuses((prev) => {
                                  const newStatuses = { ...prev };
                                  delete newStatuses[message.id];
                                  return newStatuses;
                                });
                              }}
                              style={{
                                marginLeft: '8px',
                                padding: '2px 8px',
                                fontSize: '0.7rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              title="Retry sending message"
                            >
                              Retry
                            </button>
                          )}
                        </>
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
              <div style={{ position: 'relative', width: '100%' }}>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    interimTranscript && isRecording
                      ? interimTranscript
                      : t('chat.inputPlaceholder')
                  }
                  className="chat-input"
                  rows="1"
                  disabled={!isConnected || isTranscribing}
                />
                {interimTranscript && isRecording && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      marginBottom: '4px',
                      padding: '6px 12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#059669',
                      fontStyle: 'italic',
                      maxHeight: '60px',
                      overflow: 'auto',
                    }}
                  >
                    <span style={{ fontWeight: 500, marginRight: '4px' }}>Listening:</span>
                    {interimTranscript}
                  </div>
                )}
              </div>
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
      <VoiceModeTutorial
        isOpen={showVoiceTutorial}
        onClose={() => {
          setShowVoiceTutorial(false);
          // Start voice mode after tutorial is closed
          setIsVoiceConversationActive(true);
          retryCountRef.current = 0;
          userCancelledRecordingRef.current = false;
          manuallyStoppedTTSRef.current = false;
          isStartingRecordingRef.current = true;
          startRecording();
          setVoiceStatusText(t('chat.listening'));
          toast.success(t('chat.voiceConversationStarted'));
        }}
        onDontShowAgain={() => {
          localStorage.setItem('voiceTutorialSeen', 'true');
        }}
      />
    </div>
  );
};

export default Chat;
