import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, X, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';

const PRESET_DURATIONS = [3, 5, 10, 15, 20];

/**
 * ChatMeditationTimer Component
 * A compact meditation timer optimized for inline chat display
 *
 * @param {Function} onComplete - Callback when meditation completes
 * @param {Function} onClose - Callback to close/dismiss the timer
 * @param {string} className - Additional CSS classes
 */
const ChatMeditationTimer = ({ onComplete, onClose, className = '' }) => {
  const { t } = useTranslation();
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeRemaining(selectedDuration * 60);
  }, [selectedDuration]);

  const playBellSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const frequencies = [800, 1200, 1600];

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const delay = index * 0.05;
        const duration = 1.5;
        const stopTime = audioContext.currentTime + delay + duration;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(
          0.15 / frequencies.length,
          audioContext.currentTime + delay + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(0.01, stopTime);

        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(stopTime);
      });

      setTimeout(() => {
        audioContext.close().catch(() => {});
      }, 2000);
    } catch {
      // Could not play bell sound
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    playBellSound();
    setIsPlaying(false);

    if (onComplete) {
      onComplete({
        duration: selectedDuration * 60,
        presetDuration: selectedDuration,
      });
    }
  }, [selectedDuration, onComplete, playBellSound]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, isPaused, handleTimerComplete]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setTimeRemaining(selectedDuration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <Card className={`max-w-sm overflow-hidden ${className}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">
              {t('mindfulness.meditation.title', 'Meditation Timer')}
            </CardTitle>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {/* Duration Selector */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {PRESET_DURATIONS.map((duration) => (
            <button
              key={duration}
              onClick={() => !isPlaying && setSelectedDuration(duration)}
              disabled={isPlaying}
              className={`px-3 py-1.5 text-sm rounded-full border-2 transition-all
                ${
                  selectedDuration === duration
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400'
                }
                ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {duration}m
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="flex justify-center items-center py-4">
          <div className="relative w-28 h-28">
            {/* Progress Ring */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="56"
                cy="56"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-green-500 transition-all duration-1000"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            disabled={!isPlaying && timeRemaining === selectedDuration * 60}
            className="rounded-full"
          >
            <RotateCcw size={18} />
          </Button>

          <Button variant="primary" onClick={handlePlayPause} className="px-6 rounded-full">
            {isPlaying && !isPaused ? <Pause size={18} /> : <Play size={18} />}
            <span className="ml-2">
              {isPlaying && !isPaused
                ? t('mindfulness.meditation.pause', 'Pause')
                : t('mindfulness.meditation.start', 'Start')}
            </span>
          </Button>
        </div>

        {/* Status */}
        {isPlaying && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            {isPaused
              ? t('chat.meditation.paused', 'Paused - tap play to continue')
              : t('chat.meditation.inProgress', 'Focus on your breath...')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatMeditationTimer;
