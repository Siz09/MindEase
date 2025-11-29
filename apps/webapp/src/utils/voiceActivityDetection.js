/**
 * Voice Activity Detection (VAD) Utility
 * Uses Web Audio API to detect speech vs noise
 */

/**
 * Create VAD analyzer
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Audio level threshold (0-1, default: 0.02)
 * @param {number} options.smoothingTimeConstant - Smoothing constant (0-1, default: 0.8)
 * @param {Function} options.onSpeechStart - Callback when speech is detected
 * @param {Function} options.onSpeechEnd - Callback when speech ends
 * @returns {Object} VAD controller with start, stop, and cleanup methods
 */
export const createVAD = ({
  threshold = 0.02,
  smoothingTimeConstant = 0.8,
  onSpeechStart = () => {},
  onSpeechEnd = () => {},
} = {}) => {
  let audioContext = null;
  let analyser = null;
  let microphone = null;
  let dataArray = null;
  let animationFrameId = null;
  let isSpeechActive = false;
  let speechStartTime = null;
  let silenceStartTime = null;
  const MIN_SPEECH_DURATION = 100; // Minimum 100ms to consider it speech
  const SILENCE_DURATION = 500; // 500ms of silence to consider speech ended

  /**
   * Start VAD monitoring
   */
  const start = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphone = stream;

      // Create audio context
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.fftSize = 256;
      source.connect(analyser);

      dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Start monitoring
      monitor();
    } catch (error) {
      console.error('Error starting VAD:', error);
      throw error;
    }
  };

  /**
   * Monitor audio levels
   */
  const monitor = () => {
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const normalizedLevel = average / 255; // Normalize to 0-1

    const now = Date.now();

    // Check if audio level exceeds threshold
    if (normalizedLevel > threshold) {
      if (!isSpeechActive) {
        if (!speechStartTime) {
          // Speech just started - record start time
          speechStartTime = now;
          silenceStartTime = null;
        } else if (now - speechStartTime > MIN_SPEECH_DURATION) {
          // Speech is confirmed (lasted long enough)
          isSpeechActive = true;
          onSpeechStart(normalizedLevel);
        }
      }
      // Reset silence timer when audio is above threshold
      silenceStartTime = null;
    } else {
      // Audio level below threshold
      if (isSpeechActive) {
        if (!silenceStartTime) {
          silenceStartTime = now;
        } else if (now - silenceStartTime > SILENCE_DURATION) {
          // Silence has lasted long enough - speech ended
          isSpeechActive = false;
          speechStartTime = null;
          silenceStartTime = null;
          onSpeechEnd();
        }
      } else {
        // Reset timers if we're not in speech
        speechStartTime = null;
        silenceStartTime = null;
      }
    }

    // Continue monitoring
    animationFrameId = requestAnimationFrame(monitor);
  };

  /**
   * Stop VAD monitoring
   */
  const stop = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (microphone) {
      microphone.getTracks().forEach((track) => track.stop());
      microphone = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    analyser = null;
    dataArray = null;
    isSpeechActive = false;
    speechStartTime = null;
    silenceStartTime = null;
  };

  /**
   * Get current audio level (0-1)
   */
  const getAudioLevel = () => {
    if (!analyser || !dataArray) return 0;

    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length / 255;
  };

  /**
   * Update threshold
   */
  const setThreshold = (newThreshold) => {
    threshold = Math.max(0, Math.min(1, newThreshold));
  };

  return {
    start,
    stop,
    getAudioLevel,
    setThreshold,
    isActive: () => isSpeechActive,
  };
};

/**
 * Check if VAD is supported
 */
export const isVADSupported = () => {
  return (
    typeof window !== 'undefined' &&
    (window.AudioContext || window.webkitAudioContext) &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

export default {
  createVAD,
  isVADSupported,
};
