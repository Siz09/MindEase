import { useState, useRef, useEffect, useCallback } from 'react';
import {
  getSpeechRecognition,
  isSpeechRecognitionSupported,
  getSpeechErrorMessage,
} from '../utils/speechUtils';

const useVoiceRecorder = ({
  language = 'en-US',
  continuous = false,
  interimResults = true,
  maxAlternatives = 1,
  onStart = () => {},
  onTranscriptionComplete = () => {},
  onInterimResult = () => {},
  onError = () => {},
  onEnd = (_info) => {},
  silenceTimeoutMs = 5000,
  maxDurationMs = 60000,
} = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported] = useState(isSpeechRecognitionSupported());

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const maxDurationTimerRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
      clearTimers();
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, [isRecording, clearTimers]);

  const startRecording = useCallback(() => {
    if (!isSupported || isRecording) return;

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    // Clean up any existing recognition instance before starting a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore errors when cleaning up
      }
      recognitionRef.current = null;
    }

    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsTranscribing(false);
    finalTranscriptRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        onStart(); // Notify that recording has started

        // Don't start silence timer here - wait for first speech detection
        // Max duration timer can start immediately
        if (maxDurationMs > 0) {
          maxDurationTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }, maxDurationMs);
        }
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;

          if (result.isFinal) {
            finalText += text + ' ';
          } else {
            interimText += text;
          }
        }

        // Reset or start silence timer on any speech (interim or final)
        if (silenceTimeoutMs > 0 && (finalText || interimText)) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }, silenceTimeoutMs);
        }

        if (finalText) {
          finalTranscriptRef.current += finalText;
          setTranscript(finalTranscriptRef.current.trim());
        }

        if (interimText) {
          setInterimTranscript(interimText);
          onInterimResult(interimText);
        }
      };

      recognition.onerror = (event) => {
        // Don't treat 'aborted' and 'no-speech' as errors - they're expected
        if (event.error === 'aborted' || event.error === 'no-speech') {
          setIsRecording(false);
          setIsTranscribing(false);
          clearTimers();

          // Clear the recognition ref
          if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
          }
          return; // Don't call onError for expected events
        }

        console.error('Speech recognition error:', event);

        // Provide user-friendly error messages with actionable guidance
        let errorMessage;
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorMessage =
              "Microphone permission denied. Click the lock icon in your browser's address bar, then allow microphone access. You may need to refresh the page after granting permission.";
            break;
          case 'network':
            errorMessage =
              'Network error detected. Please check your internet connection and try again. If the problem persists, refresh the page or check your firewall settings.';
            break;
          case 'audio-capture':
            errorMessage =
              "No microphone detected. Please connect a microphone to your device and ensure it's not being used by another application. Check your system sound settings to verify the microphone is working.";
            break;
          case 'service-not-allowed':
            errorMessage =
              'Speech recognition service is not available. This may be due to browser restrictions or service unavailability. Please try again in a few moments, or try using a different browser (Chrome or Edge recommended).';
            break;
          default:
            errorMessage =
              getSpeechErrorMessage(event, (key) => key) ||
              'Voice input failed. Please check your microphone connection and browser permissions, then try again.';
        }

        setError(errorMessage);
        setIsRecording(false);
        setIsTranscribing(false);
        clearTimers();

        // Clear the recognition ref on error
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }

        onError(errorMessage);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsTranscribing(false);
        clearTimers();

        // Clear the recognition ref when it ends
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }

        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          setTranscript(finalText);
          onTranscriptionComplete(finalText);
        }
        onEnd();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);

      // Provide specific error message based on error type with actionable guidance
      let errorMessage = 'Failed to start voice recording. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage +=
          'Please enable microphone permissions in your browser settings. Click the lock icon in the address bar and allow microphone access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage +=
          'No microphone found. Please connect a microphone to your device and check your system sound settings.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage +=
          'Voice input is not supported in this browser. Please use Chrome, Edge, or Safari (with flag enabled).';
      } else {
        errorMessage +=
          'Please check your microphone connection and browser permissions, then try again.';
      }

      setError(errorMessage);
      setIsRecording(false);
      onError(errorMessage);
    }
  }, [
    isSupported,
    isRecording,
    language,
    continuous,
    interimResults,
    maxAlternatives,
    silenceTimeoutMs,
    maxDurationMs,
    onStart,
    onTranscriptionComplete,
    onInterimResult,
    onError,
    onEnd,
    clearTimers,
  ]);

  const cancelRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      const recognition = recognitionRef.current;
      recognition.abort();
      recognitionRef.current = null;
      setIsRecording(false);
      setIsTranscribing(false);
      setTranscript('');
      setInterimTranscript('');
      finalTranscriptRef.current = '';
      clearTimers();
      onEnd({ cancelled: true });
    } catch (err) {
      console.error('Error cancelling recognition:', err);
      recognitionRef.current = null;
    }
  }, [clearTimers, onEnd]);

  const reset = useCallback(() => {
    if (isRecording) {
      cancelRecording();
      return;
    }
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsTranscribing(false);
    finalTranscriptRef.current = '';
  }, [isRecording, cancelRecording]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }
    };
  }, [clearTimers]);

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    isRecording,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isTranscribing,
    lang: language,
  };
};

export default useVoiceRecorder;
