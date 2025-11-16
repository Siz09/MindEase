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
  onEnd = () => {},
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

        if (silenceTimeoutMs > 0) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording();
          }, silenceTimeoutMs);
        }

        if (maxDurationMs > 0) {
          maxDurationTimerRef.current = setTimeout(() => {
            stopRecording();
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

        if (finalText) {
          finalTranscriptRef.current += finalText;
          setTranscript(finalTranscriptRef.current.trim());

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              stopRecording();
            }, silenceTimeoutMs);
          }
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
        const errorMessage = getSpeechErrorMessage(event, (key) => key);
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
      setError('Failed to start recording');
      setIsRecording(false);
      onError('Failed to start recording');
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
    stopRecording,
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
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsTranscribing(false);
    finalTranscriptRef.current = '';
  }, []);

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
