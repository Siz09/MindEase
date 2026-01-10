import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { detectVoiceCommand, isVoiceCommand } from '../utils/voiceCommands';
import {
  trackVoiceModeStarted,
  trackVoiceModeStopped,
  trackVoiceCommand,
} from '../utils/voiceAnalytics';
import { requestMicrophonePermission } from '../utils/speechUtils';

/**
 * Custom hook for managing voice conversation mode
 *
 * Features:
 * - Voice conversation state management
 * - Voice command detection and execution
 * - Continuous listening with cooldowns
 * - Visibility change handling (pause/resume)
 * - Integration with voice recorder and TTS
 * - Analytics tracking
 * - Tutorial handling
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.isVoiceInputEnabled - Whether voice input is enabled
 * @param {boolean} options.wsConnected - WebSocket connection status
 * @param {Function} options.sendMessage - Function to send messages
 * @param {Object} options.recorder - Voice recorder object with { startRecording, cancelRecording, isRecording, isTranscribing }
 * @param {Function} options.isPlaying - Current TTS playing state
 * @param {Function} options.stopSpeech - Function to stop TTS
 * @param {Function} options.pauseSpeech - Function to pause TTS
 * @param {Function} options.resumeSpeech - Function to resume TTS
 * @param {Function} options.speak - Function to speak text
 * @param {Function} options.clearTTSQueue - Function to clear TTS queue
 * @param {Function} options.setCurrentPlayingMessageId - Function to set playing message ID
 * @param {Function} options.setMessageQueue - Function to set message queue
 * @param {Function} options.setInputValue - Function to set input value
 * @param {Function} options.setIsVoiceTranscribed - Function to set voice transcribed state
 * @param {Function} options.setVoiceStatusText - Function to set voice status text
 * @param {Function} options.setTTSVolume - Function to set TTS volume
 * @param {Function} options.setTTSRate - Function to set TTS rate
 * @param {number} options.ttsRate - Current TTS rate
 * @param {number} options.ttsVolume - Current TTS volume
 * @param {Object} options.lastBotMessageRef - Ref to last bot message
 * @returns {Object} Voice conversation state and operations
 */
export const useVoiceConversation = ({
  isVoiceInputEnabled,
  wsConnected,
  sendMessage,
  recorder,
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
}) => {
  const { t } = useTranslation();
  const [isVoiceConversationActive, setIsVoiceConversationActive] = useState(false);
  const [showVoiceTutorial, setShowVoiceTutorial] = useState(false);

  // Extract recorder functions
  const startRecording = recorder?.startRecording;
  const cancelRecording = recorder?.cancelRecording;
  const isRecording = recorder?.isRecording ?? false;
  const isTranscribing = recorder?.isTranscribing ?? false;

  // Refs for managing voice conversation state
  const isVoiceConversationActiveRef = useRef(false);
  const voiceModeStartTimeRef = useRef(null);
  const isStartingRecordingRef = useRef(false);
  const lastRecordingStartRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const originalTTSVolumeRef = useRef(1.0);
  const isDuckingRef = useRef(false);
  const ttsVolumeRef = useRef(1.0);

  // Update ref when state changes
  useEffect(() => {
    isVoiceConversationActiveRef.current = isVoiceConversationActive;
  }, [isVoiceConversationActive]);

  // Update TTS volume ref
  useEffect(() => {
    ttsVolumeRef.current = ttsVolume;
  }, [ttsVolume]);

  // Helper function to interrupt TTS when user starts speaking
  const interruptTTS = useCallback(() => {
    if (isVoiceConversationActiveRef.current && (isPlaying || window.speechSynthesis?.speaking)) {
      if (stopSpeech) stopSpeech();
      setCurrentPlayingMessageId(null);
      setMessageQueue([]);
      // Force cancel any pending TTS synchronously
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying, stopSpeech, setCurrentPlayingMessageId, setMessageQueue]);

  // Handle voice command execution
  const handleVoiceCommand = useCallback(
    (command) => {
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
          if (window.speechSynthesis?.speaking && !window.speechSynthesis?.paused) {
            pauseSpeech();
            toast.info(t('chat.ttsPaused') || 'Speech paused');
            commandExecuted = true;
          }
          break;

        case 'resume':
          if (window.speechSynthesis?.paused) {
            resumeSpeech();
            toast.info(t('chat.ttsResumed') || 'Speech resumed');
            commandExecuted = true;
          }
          break;

        case 'repeat':
          if (lastBotMessageRef?.current) {
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
          toast.info(t('chat.volumeIncreased') || `Volume: ${Math.round(newLouderVolume * 100)}%`);
          commandExecuted = true;
          break;
        }

        case 'quieter': {
          const newQuieterVolume = Math.max(0.1, ttsVolume - 0.1);
          setTTSVolume(newQuieterVolume);
          toast.info(t('chat.volumeDecreased') || `Volume: ${Math.round(newQuieterVolume * 100)}%`);
          commandExecuted = true;
          break;
        }
      }

      return commandExecuted;
    },
    [
      isRecording,
      isPlaying,
      cancelRecording,
      stopSpeech,
      pauseSpeech,
      resumeSpeech,
      speak,
      clearTTSQueue,
      setCurrentPlayingMessageId,
      setMessageQueue,
      setVoiceStatusText,
      setTTSVolume,
      setTTSRate,
      ttsRate,
      ttsVolume,
      lastBotMessageRef,
      t,
    ]
  );

  // Process transcribed text (handle commands or send as message)
  const handleTranscription = useCallback(
    async (text) => {
      if (!text || !text.trim()) {
        // If no text transcribed, just restart listening in voice conversation mode
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
        const commandExecuted = handleVoiceCommand(command);

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

      // Restore TTS volume after speech ends (audio ducking)
      if (isDuckingRef.current) {
        setTTSVolume(originalTTSVolumeRef.current);
        isDuckingRef.current = false;
      }

      // Use ref to get current value instead of captured state
      if (isVoiceConversationActiveRef.current) {
        // Send the message (non-blocking) and immediately restart listening
        sendMessage(text)
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
      }
    },
    [
      isRecording,
      isTranscribing,
      startRecording,
      setInputValue,
      setIsVoiceTranscribed,
      setVoiceStatusText,
      setTTSVolume,
      sendMessage,
      handleVoiceCommand,
      t,
    ]
  );

  // Handle interim transcription (for audio ducking)
  const handleInterimTranscription = useCallback(
    (interimText) => {
      // Interrupt TTS as soon as we detect any speech
      if (interimText && interimText.trim().length > 0) {
        // Implement audio ducking: reduce TTS volume instead of hard stop
        if (isPlaying && !isDuckingRef.current && isVoiceConversationActiveRef.current) {
          // Use ref to get current volume value instead of closure
          originalTTSVolumeRef.current = ttsVolumeRef.current;
          setTTSVolume(ttsVolumeRef.current * 0.3); // Reduce to 30% of original volume
          isDuckingRef.current = true;
        }
        interruptTTS();
      }
    },
    [isPlaying, interruptTTS, setTTSVolume]
  );

  // Toggle voice conversation mode
  const toggleVoiceConversation = useCallback(async () => {
    if (isVoiceConversationActive) {
      // Stop voice conversation
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
      // Start voice conversation
      if (!isVoiceInputEnabled) {
        toast.error(t('chat.enableVoiceInSettings'));
        return;
      }
      if (!wsConnected) {
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
      isStartingRecordingRef.current = true;
      startRecording();
      setVoiceStatusText(t('chat.listening'));
      toast.success(t('chat.voiceConversationStarted'));
      trackVoiceModeStarted();
    }
  }, [
    isVoiceConversationActive,
    isVoiceInputEnabled,
    wsConnected,
    isRecording,
    isPlaying,
    cancelRecording,
    stopSpeech,
    clearTTSQueue,
    setCurrentPlayingMessageId,
    setMessageQueue,
    setVoiceStatusText,
    setTTSVolume,
    startRecording,
    t,
  ]);

  // Continuous listening in voice conversation mode
  useEffect(() => {
    // Clear any existing timer first
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Early return guard using refs to avoid stale closures
    if (
      !isVoiceConversationActiveRef.current ||
      !wsConnected ||
      isRecording ||
      isTranscribing ||
      isStartingRecordingRef.current
    ) {
      return;
    }

    // Add cooldown to prevent rapid restarts
    const now = Date.now();
    const timeSinceLastStart = now - lastRecordingStartRef.current;
    const cooldownPeriod = 350; // 350ms minimum between recordings

    if (timeSinceLastStart < cooldownPeriod) {
      // Schedule a check after cooldown period
      const remainingCooldown = cooldownPeriod - timeSinceLastStart;
      recordingTimerRef.current = setTimeout(() => {
        recordingTimerRef.current = null;
        // Trigger effect re-evaluation by checking conditions
        if (
          isVoiceConversationActiveRef.current &&
          wsConnected &&
          !isRecording &&
          !isTranscribing &&
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
        wsConnected &&
        !isRecording &&
        !isTranscribing &&
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
    wsConnected,
    isRecording,
    isTranscribing,
    isPlaying,
    startRecording,
    setVoiceStatusText,
    t,
  ]);

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
    setCurrentPlayingMessageId,
    setVoiceStatusText,
    t,
  ]);

  return {
    // State
    isVoiceConversationActive,
    showVoiceTutorial,

    // Setters
    setIsVoiceConversationActive,
    setShowVoiceTutorial,

    // Operations
    toggleVoiceConversation,
    handleTranscription,
    handleInterimTranscription,
    handleVoiceCommand,
    interruptTTS,

    // Refs (for advanced usage)
    isVoiceConversationActiveRef,
    voiceModeStartTimeRef,
    isStartingRecordingRef,
    lastRecordingStartRef,
    recordingTimerRef,
    originalTTSVolumeRef,
    isDuckingRef,
    ttsVolumeRef,
  };
};
