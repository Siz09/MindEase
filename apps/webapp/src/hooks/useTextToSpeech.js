import { useState, useRef, useEffect, useCallback } from 'react';
import { isSpeechSynthesisSupported, loadVoices, filterVoicesByLang } from '../utils/speechUtils';

const useTextToSpeech = ({
  language = 'en-US',
  autoPlay = false,
  defaultRate = 1.0,
  defaultVolume = 1.0,
  defaultPitch = 1.0,
  onComplete = () => {},
  onError = () => {},
} = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(defaultRate);
  const [volume, setVolume] = useState(defaultVolume);
  const [pitch, setPitch] = useState(defaultPitch);
  const [queue, setQueue] = useState([]);
  const [isSupported] = useState(isSpeechSynthesisSupported());

  const currentUtteranceRef = useRef(null);

  useEffect(() => {
    if (!isSupported) return;

    loadVoices((voices) => {
      setAvailableVoices(voices);

      const langVoices = filterVoicesByLang(voices, language);
      const defaultVoice = langVoices.find((v) => v.default) || langVoices[0] || voices[0];

      if (defaultVoice && !selectedVoice) {
        setSelectedVoice(defaultVoice);
      }
    });
  }, [isSupported, language, selectedVoice]);

  const processQueue = useCallback(() => {
    if (queue.length === 0) {
      setCurrentText('');
      onComplete();
      return;
    }

    const nextItem = queue[0];
    setQueue((prev) => prev.slice(1));

    if (nextItem?.text) {
      speak(nextItem.text, nextItem.options);
    }
  }, [queue, onComplete]);

  const speak = useCallback(
    (text, options = {}) => {
      if (!isSupported || !text || text.trim() === '') return;

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.voice = options.voice || selectedVoice;
        utterance.rate = options.rate !== undefined ? options.rate : rate;
        utterance.volume = options.volume !== undefined ? options.volume : volume;
        utterance.pitch = options.pitch !== undefined ? options.pitch : pitch;
        utterance.lang = options.lang || language;

        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
          setCurrentText(text);
        };

        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentText('');
          currentUtteranceRef.current = null;

          setTimeout(() => {
            processQueue();
          }, 100);
        };

        utterance.onerror = (event) => {
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            console.error('Speech synthesis error:', event);
          }
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentText('');
          currentUtteranceRef.current = null;
          onError(event);
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Error in text-to-speech:', err);
        onError(err);
      }
    },
    [isSupported, selectedVoice, rate, volume, pitch, language, onError, processQueue]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;

    try {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentText('');
      setQueue([]);
      currentUtteranceRef.current = null;
    } catch (err) {
      console.error('Error stopping speech:', err);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isPlaying) return;

    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch (err) {
      console.error('Error pausing speech:', err);
    }
  }, [isSupported, isPlaying]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;

    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch (err) {
      console.error('Error resuming speech:', err);
    }
  }, [isSupported, isPaused]);

  const addToQueue = useCallback((text, options = {}) => {
    setQueue((prev) => [...prev, { text, options }]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const getVoices = useCallback(() => {
    return availableVoices;
  }, [availableVoices]);

  const changeVoice = useCallback((voice) => {
    setSelectedVoice(voice);
  }, []);

  const changeRate = useCallback((newRate) => {
    setRate(Math.max(0.1, Math.min(10, newRate)));
  }, []);

  const changeVolume = useCallback((newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const changePitch = useCallback((newPitch) => {
    setPitch(Math.max(0, Math.min(2, newPitch)));
  }, []);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    addToQueue,
    clearQueue,
    isPlaying,
    isPaused,
    currentText,
    availableVoices,
    selectedVoice,
    setVoice: changeVoice,
    rate,
    setRate: changeRate,
    volume,
    setVolume: changeVolume,
    pitch,
    setPitch: changePitch,
    getVoices,
    queue,
    isSupported,
  };
};

export default useTextToSpeech;
