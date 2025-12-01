import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/mindfulness/BreathingTimer.css';

const BREATHING_PATTERNS = {
  478: { name: '4-7-8 Breathing', inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  box: { name: 'Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  relaxing: { name: 'Relaxing Breath', inhale: 4, hold1: 0, exhale: 6, hold2: 0 },
  energizing: { name: 'Energizing Breath', inhale: 2, hold1: 0, exhale: 2, hold2: 0 },
};

const BreathingTimer = ({ onComplete }) => {
  const { t } = useTranslation();
  const [selectedPattern, setSelectedPattern] = useState('478');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('inhale');
  const [countdown, setCountdown] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const startTimeRef = useRef(null);

  const pattern = BREATHING_PATTERNS[selectedPattern];
  const cycleDuration = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
  const isPlayingRef = useRef(isPlaying);

  // Keep ref in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now();
      setCurrentPhase('inhale');

      // Clear any existing intervals first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const currentPattern = BREATHING_PATTERNS[selectedPattern];
      if (!currentPattern) {
        setIsPlaying(false);
        return;
      }

      let phaseIndex = 0;
      const phases = [
        { name: 'inhale', duration: currentPattern.inhale },
        { name: 'hold1', duration: currentPattern.hold1 },
        { name: 'exhale', duration: currentPattern.exhale },
        { name: 'hold2', duration: currentPattern.hold2 },
      ].filter((p) => p.duration > 0);

      if (phases.length === 0) {
        setIsPlaying(false);
        return;
      }

      const executePhase = () => {
        if (!isPlayingRef.current) {
          return; // Stop if playing was turned off
        }

        const phase = phases[phaseIndex];
        if (!phase) {
          setIsPlaying(false);
          return;
        }

        setCurrentPhase(phase.name);
        setCountdown(phase.duration);

        // Clear previous interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Start countdown for this phase
        intervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              // Move to next phase
              phaseIndex = (phaseIndex + 1) % phases.length;
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              // Execute next phase after a brief delay
              setTimeout(() => {
                if (isPlayingRef.current) {
                  executePhase();
                }
              }, 100);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      };

      executePhase();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCountdown(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, selectedPattern]);

  useEffect(() => {
    // Update session duration every second
    if (isPlaying) {
      const durationInterval = setInterval(() => {
        if (startTimeRef.current) {
          setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      return () => clearInterval(durationInterval);
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPhase('inhale');
    setCountdown(0);
    setSessionDuration(0);
    startTimeRef.current = null;
  };

  const handleComplete = () => {
    if (onComplete && sessionDuration > 0) {
      onComplete({
        duration: sessionDuration,
        pattern: selectedPattern,
        patternName: pattern.name,
      });
    }
    handleReset();
  };

  const getCircleSize = () => {
    switch (currentPhase) {
      case 'inhale':
        return 300;
      case 'hold1':
        return 300;
      case 'exhale':
        return 150;
      case 'hold2':
        return 150;
      default:
        return 200;
    }
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'inhale':
        return t('mindfulness.breathing.inhale', 'Inhale');
      case 'hold1':
        return t('mindfulness.breathing.hold', 'Hold');
      case 'exhale':
        return t('mindfulness.breathing.exhale', 'Exhale');
      case 'hold2':
        return t('mindfulness.breathing.hold', 'Hold');
      default:
        return '';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="breathing-timer-container">
      <div className="breathing-timer-header">
        <h3>{t('mindfulness.breathing.title', 'Breathing Exercise')}</h3>
        <div className="breathing-pattern-selector">
          {Object.entries(BREATHING_PATTERNS).map(([key, value]) => (
            <button
              key={key}
              className={`pattern-btn ${selectedPattern === key ? 'active' : ''}`}
              onClick={() => !isPlaying && setSelectedPattern(key)}
              disabled={isPlaying}
            >
              {value.name}
            </button>
          ))}
        </div>
      </div>

      <div className="breathing-visual">
        <motion.div
          className="breathing-circle"
          animate={{
            scale: currentPhase === 'inhale' || currentPhase === 'hold1' ? 1 : 0.5,
            opacity: isPlaying ? 1 : 0.7,
          }}
          transition={{
            duration:
              currentPhase === 'inhale'
                ? pattern.inhale
                : currentPhase === 'exhale'
                  ? pattern.exhale
                  : 0,
            ease: currentPhase === 'inhale' ? 'easeOut' : 'easeIn',
          }}
          style={{
            width: getCircleSize(),
            height: getCircleSize(),
          }}
        >
          <div className="breathing-phase-label">{getPhaseLabel()}</div>
          <div className="breathing-countdown">{countdown}</div>
        </motion.div>
      </div>

      <div className="breathing-controls">
        <div className="breathing-info">
          <span className="session-duration">{formatDuration(sessionDuration)}</span>
          {isPlaying && (
            <span className="cycle-count">
              {t('mindfulness.breathing.cycle', 'Cycle')}:{' '}
              {Math.floor(sessionDuration / cycleDuration) + 1}
            </span>
          )}
        </div>

        <div className="control-buttons">
          <button
            className="btn btn-icon"
            onClick={handleReset}
            disabled={!isPlaying && sessionDuration === 0}
          >
            <RotateCcw size={24} />
          </button>
          <button className="btn btn-primary btn-large" onClick={handlePlayPause}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            {isPlaying
              ? t('mindfulness.breathing.pause', 'Pause')
              : t('mindfulness.breathing.start', 'Start')}
          </button>
          {sessionDuration > 0 && (
            <button className="btn btn-secondary" onClick={handleComplete}>
              {t('mindfulness.breathing.complete', 'Complete')}
            </button>
          )}
        </div>
      </div>

      <div className="breathing-instructions">
        <p>
          {t(
            'mindfulness.breathing.instructions',
            'Follow the circle: Inhale as it expands, exhale as it contracts.'
          )}
        </p>
        <p className="pattern-description">
          {pattern.name}: {pattern.inhale}s in, {pattern.hold1 > 0 && `${pattern.hold1}s hold, `}
          {pattern.exhale}s out{pattern.hold2 > 0 && `, ${pattern.hold2}s hold`}
        </p>
      </div>
    </div>
  );
};

export default BreathingTimer;
