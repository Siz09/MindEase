import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { BREATHING_PATTERNS } from './BreathingPatternSelector';

/**
 * ChatBreathingTimer Component
 * A compact breathing timer optimized for inline chat display
 *
 * @param {string} patternKey - The selected breathing pattern key
 * @param {Object} pattern - The pattern object with timing details
 * @param {Function} onComplete - Callback when session is completed
 * @param {Function} onClose - Callback to close/dismiss the timer
 * @param {string} className - Additional CSS classes
 */
const ChatBreathingTimer = ({
  patternKey = '478',
  pattern: patternProp,
  onComplete,
  onClose,
  className = '',
}) => {
  const { t } = useTranslation();
  const pattern = patternProp || BREATHING_PATTERNS[patternKey];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('ready');
  const [countdown, setCountdown] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);

  const cycleDuration = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;

  // Keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now();
      setCurrentPhase('inhale');

      // Clear existing timers
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      let phaseIndex = 0;
      const phases = [
        { name: 'inhale', duration: pattern.inhale },
        { name: 'hold1', duration: pattern.hold1 },
        { name: 'exhale', duration: pattern.exhale },
        { name: 'hold2', duration: pattern.hold2 },
      ].filter((p) => p.duration > 0);

      const executePhase = () => {
        if (!isPlayingRef.current) return;

        const phase = phases[phaseIndex];
        if (!phase) {
          setIsPlaying(false);
          return;
        }

        setCurrentPhase(phase.name);
        setCountdown(phase.duration);

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              phaseIndex = (phaseIndex + 1) % phases.length;
              if (intervalRef.current) clearInterval(intervalRef.current);
              timeoutRef.current = setTimeout(() => {
                if (isPlayingRef.current) executePhase();
              }, 100);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      };

      executePhase();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCountdown(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, pattern]);

  // Track session duration
  useEffect(() => {
    if (isPlaying) {
      const durationInterval = setInterval(() => {
        if (startTimeRef.current) {
          setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      return () => clearInterval(durationInterval);
    }
  }, [isPlaying]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPhase('ready');
    setCountdown(0);
    setSessionDuration(0);
    startTimeRef.current = null;
  };

  const handleComplete = () => {
    if (onComplete && sessionDuration > 0) {
      onComplete({
        duration: sessionDuration,
        pattern: patternKey,
        patternName: pattern.name,
        cycles: Math.floor(sessionDuration / cycleDuration),
      });
    }
    handleReset();
    if (onClose) onClose();
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'inhale':
        return t('mindfulness.breathing.inhale', 'Inhale');
      case 'hold1':
      case 'hold2':
        return t('mindfulness.breathing.hold', 'Hold');
      case 'exhale':
        return t('mindfulness.breathing.exhale', 'Exhale');
      default:
        return t('chat.breathing.ready', 'Ready');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCircleScale = () => {
    if (currentPhase === 'inhale' || currentPhase === 'hold1') return 1;
    if (currentPhase === 'exhale' || currentPhase === 'hold2') return 0.6;
    return 0.8;
  };

  return (
    <Card className={`max-w-sm overflow-hidden ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{pattern.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {pattern.inhale}s in
              {pattern.hold1 > 0 && ` → ${pattern.hold1}s hold`}
              {` → ${pattern.exhale}s out`}
              {pattern.hold2 > 0 && ` → ${pattern.hold2}s hold`}
            </div>
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

        {/* Breathing Circle */}
        <div className="flex justify-center items-center py-6">
          <motion.div
            animate={{
              scale: getCircleScale(),
              opacity: isPlaying ? 1 : 0.7,
            }}
            transition={{
              duration:
                currentPhase === 'inhale'
                  ? pattern.inhale
                  : currentPhase === 'exhale'
                    ? pattern.exhale
                    : 0.3,
              ease: currentPhase === 'inhale' ? 'easeOut' : 'easeIn',
            }}
            className="w-32 h-32 rounded-full flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="text-white text-sm font-medium uppercase tracking-wide">
              {getPhaseLabel()}
            </div>
            <div className="text-white text-3xl font-bold">{countdown || '•'}</div>
          </motion.div>
        </div>

        {/* Session Info */}
        <div className="flex items-center justify-center gap-4 mb-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {formatDuration(sessionDuration)}
          </span>
          {isPlaying && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
              Cycle {Math.floor(sessionDuration / cycleDuration) + 1}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            disabled={!isPlaying && sessionDuration === 0}
            className="rounded-full"
          >
            <RotateCcw size={18} />
          </Button>

          <Button variant="primary" onClick={handlePlayPause} className="px-6 rounded-full">
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span className="ml-2">
              {isPlaying
                ? t('mindfulness.breathing.pause', 'Pause')
                : t('mindfulness.breathing.start', 'Start')}
            </span>
          </Button>

          {sessionDuration > 0 && !isPlaying && (
            <Button variant="outline" size="sm" onClick={handleComplete} className="rounded-full">
              {t('mindfulness.breathing.complete', 'Done')}
            </Button>
          )}
        </div>

        {/* Instructions */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          {t(
            'mindfulness.breathing.instructions',
            'Follow the circle: Inhale as it expands, exhale as it contracts.'
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default ChatBreathingTimer;
