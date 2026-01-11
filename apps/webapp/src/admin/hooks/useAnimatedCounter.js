import { useState, useEffect, useRef } from 'react';

/**
 * Hook to animate a number from 0 to target value
 * @param {number} target - Target value to animate to
 * @param {number} duration - Animation duration in ms (default: 1000)
 * @param {boolean} enabled - Whether animation is enabled (default: true)
 * @returns {number} Current animated value
 */
export function useAnimatedCounter(target, duration = 1000, enabled = true) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setCount(target);
      return;
    }

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    startValueRef.current = count;
    startTimeRef.current = null;

    const animate = (currentTime) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(
        startValueRef.current + (target - startValueRef.current) * easeOut
      );

      setCount(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, enabled]);

  return count;
}

export default useAnimatedCounter;
