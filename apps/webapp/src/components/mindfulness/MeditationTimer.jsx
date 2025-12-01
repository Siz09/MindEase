import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Bell } from 'lucide-react';
import '../../styles/mindfulness/MeditationTimer.css';

// Use Web Audio API compatible sounds or provide fallback
const AMBIENT_SOUNDS = {
  none: { name: 'None', url: null },
  // Note: These URLs should point to actual sound files or be removed if unavailable
  // For now, we'll use silent mode or generate tones client-side
  rain: { name: 'Rain', url: null }, // Placeholder - implement with actual audio or remove
  ocean: { name: 'Ocean Waves', url: null }, // Placeholder
  forest: { name: 'Forest', url: null }, // Placeholder
};

const PRESET_DURATIONS = [5, 10, 15, 20, 30, 45, 60];

/**
 * MeditationTimer Component
 *
 * @param {Function} onComplete - Callback when meditation completes. Receives { duration, presetDuration }
 * @param {Function} onMoodCheckIn - Mood check-in callback with unified signature:
 *   onMoodCheckIn(phase: 'pre'|'post', payload: object, callback?: function)
 *   - For 'pre' phase: payload is empty object {}, callback is required function(mood)
 *   - For 'post' phase: payload contains { preMood, duration, postMood }, callback is optional
 */
const MeditationTimer = ({ onComplete, onMoodCheckIn }) => {
  const { t } = useTranslation();
  const [customDuration, setCustomDuration] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState(600); // seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSound, setSelectedSound] = useState('none');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [preMood, setPreMood] = useState(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const isBlobUrlRef = useRef(false);

  useEffect(() => {
    setTimeRemaining(selectedDuration * 60);
  }, [selectedDuration]);

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
  }, [isPlaying, isPaused, timeRemaining]);

  useEffect(() => {
    if (soundEnabled && selectedSound !== 'none' && AMBIENT_SOUNDS[selectedSound]?.url) {
      const soundUrl = AMBIENT_SOUNDS[selectedSound].url;

      if (audioRef.current) {
        audioRef.current.pause();
        if (isBlobUrlRef.current && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
        isBlobUrlRef.current = false;
      }

      try {
        audioRef.current = new Audio(soundUrl);
        isBlobUrlRef.current = soundUrl.startsWith('blob:');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        audioRef.current.preload = 'auto';

        audioRef.current.addEventListener('error', (e) => {
          console.warn('Ambient sound failed to load:', selectedSound);
          // Silently fail - ambient sounds are optional
          if (audioRef.current) {
            audioRef.current = null;
          }
        });

        if (isPlaying && !isPaused) {
          audioRef.current.play().catch((err) => {
            console.warn('Failed to play ambient sound:', err);
          });
        }
      } catch (err) {
        console.warn('Error creating ambient sound:', err);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        if (isBlobUrlRef.current && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
        isBlobUrlRef.current = false;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (isBlobUrlRef.current && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
        isBlobUrlRef.current = false;
      }
    };
  }, [soundEnabled, selectedSound, isPlaying, isPaused]);

  const handleTimerComplete = () => {
    playBellSound();
    setIsPlaying(false);
    setShowMoodCheckIn(true);

    if (onComplete) {
      // Calculate duration: if timer naturally completed (timeRemaining <= 1), use full duration
      // Otherwise compute elapsed time
      const duration =
        timeRemaining <= 1 ? selectedDuration * 60 : selectedDuration * 60 - timeRemaining;

      onComplete({
        duration,
        presetDuration: selectedDuration,
      });
    }
  };

  const playBellSound = () => {
    // Generate bell tone using Web Audio API
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return;
      }

      const audioContext = new AudioContext();

      // Create a more pleasant bell-like sound with multiple frequencies
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
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(
          0.2 / frequencies.length,
          audioContext.currentTime + delay + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + delay + duration
        );

        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      });
    } catch (e) {
      console.warn('Could not generate bell tone:', e);
    }
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      // Starting meditation - ask for mood if not already set
      if (preMood === null && typeof onMoodCheckIn === 'function') {
        onMoodCheckIn('pre', {}, (mood) => {
          setPreMood(mood);
          setIsPlaying(true);
          setIsPaused(false);
        });
      } else {
        setIsPlaying(true);
        setIsPaused(false);
      }
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setTimeRemaining(selectedDuration * 60);
    setPreMood(null);
  };

  const handleMoodSubmit = (postMood) => {
    if (typeof onMoodCheckIn === 'function') {
      // Calculate duration: if timer naturally completed, use full duration
      const duration =
        timeRemaining <= 1 ? selectedDuration * 60 : selectedDuration * 60 - timeRemaining;

      onMoodCheckIn('post', {
        preMood,
        postMood,
        duration,
      });
    }
    setShowMoodCheckIn(false);
    handleReset();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100;

  return (
    <div className="meditation-timer-container">
      <div className="meditation-timer-header">
        <h3>{t('mindfulness.meditation.title', 'Meditation Timer')}</h3>
      </div>

      {showMoodCheckIn && onMoodCheckIn ? (
        <div className="mood-check-in">
          <h4>{t('mindfulness.meditation.howDoYouFeel', 'How do you feel after meditation?')}</h4>
          <p className="mood-check-in-subtitle">
            {t(
              'mindfulness.meditation.selectYourMood',
              'Select a number from 1 (low) to 10 (excellent)'
            )}
          </p>
          <div className="mood-options">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mood) => (
              <button
                key={mood}
                className="mood-btn"
                onClick={() => handleMoodSubmit(mood)}
                aria-label={`Mood ${mood} out of 10`}
              >
                {mood}
              </button>
            ))}
          </div>
          <div className="mood-scale-labels">
            <span>{t('mindfulness.meditation.low', 'Low')}</span>
            <span>{t('mindfulness.meditation.excellent', 'Excellent')}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="duration-selector">
            <div className="preset-durations">
              {PRESET_DURATIONS.map((duration) => (
                <button
                  key={duration}
                  className={`duration-btn ${selectedDuration === duration ? 'active' : ''}`}
                  onClick={() => !isPlaying && setSelectedDuration(duration)}
                  disabled={isPlaying}
                >
                  {duration}m
                </button>
              ))}
            </div>
            <div className="custom-duration">
              <label>{t('mindfulness.meditation.customDuration', 'Custom (minutes)')}:</label>
              <input
                type="number"
                min="1"
                max="120"
                value={customDuration}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value);
                  if (isNaN(parsed)) {
                    return;
                  }
                  const clamped = Math.min(120, Math.max(1, parsed));
                  setCustomDuration(clamped);
                  if (!isPlaying) {
                    setSelectedDuration(clamped);
                  }
                }}
                disabled={isPlaying}
              />
            </div>
          </div>

          <div className="meditation-display">
            <div className="time-display">{formatTime(timeRemaining)}</div>
            <div className="progress-ring">
              <svg width="200" height="200" className="progress-svg">
                <circle className="progress-circle-bg" cx="100" cy="100" r="90" />
                <circle
                  className="progress-circle"
                  cx="100"
                  cy="100"
                  r="90"
                  style={{
                    strokeDasharray: 565.48,
                    strokeDashoffset: 565.48 - (565.48 * progress) / 100,
                  }}
                />
              </svg>
              <div className="progress-center">
                <Bell size={32} />
              </div>
            </div>
          </div>

          <div className="sound-controls">
            <label>{t('mindfulness.meditation.ambientSound', 'Ambient Sound')}:</label>
            <select
              value={selectedSound}
              onChange={(e) => !isPlaying && setSelectedSound(e.target.value)}
              disabled={isPlaying}
            >
              {Object.entries(AMBIENT_SOUNDS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
            {selectedSound !== 'none' && (
              <div className="sound-status">
                {!AMBIENT_SOUNDS[selectedSound]?.url && (
                  <span className="sound-unavailable">
                    {t('mindfulness.meditation.soundUnavailable', 'Sound file not available')}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="meditation-controls">
            <button
              className="btn btn-icon"
              onClick={handleReset}
              disabled={!isPlaying && timeRemaining === selectedDuration * 60}
            >
              <RotateCcw size={24} />
            </button>
            <button className="btn btn-primary btn-large" onClick={handlePlayPause}>
              {isPlaying && !isPaused ? <Pause size={24} /> : <Play size={24} />}
              {isPlaying && !isPaused
                ? t('mindfulness.meditation.pause', 'Pause')
                : t('mindfulness.meditation.start', 'Start')}
            </button>
          </div>

          {preMood !== null && (
            <div className="pre-mood-indicator">
              {t('mindfulness.meditation.startingMood', 'Starting mood')}: {preMood}/10
            </div>
          )}
        </>
      )}

      {/* Bell sound will be generated using Web Audio API if needed */}
    </div>
  );
};

export default MeditationTimer;
