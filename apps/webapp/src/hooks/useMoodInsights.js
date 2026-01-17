import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const REQUEST_TIMEOUT_MS = 25000;

export default function useMoodInsights({ days = 90, pageSize } = {}) {
  const [moodHistory, setMoodHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort?.();
    };
  }, []);

  const fetchMoodHistory = useCallback(async () => {
    controllerRef.current?.abort?.();
    const controller = new AbortController();
    controllerRef.current = controller;

    let timeoutId;
    let didTimeout = false;

    try {
      setIsLoading(true);
      setError(null);

      const resolvedDays = (() => {
        const candidateDays = typeof days === 'number' ? days : Number(days);
        if (Number.isFinite(candidateDays)) return Math.min(365, Math.max(1, candidateDays));
        const candidateFromPageSize = typeof pageSize === 'number' ? pageSize : Number(pageSize);
        if (Number.isFinite(candidateFromPageSize))
          return Math.min(365, Math.max(1, candidateFromPageSize));
        return 90;
      })();

      timeoutId = setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      const response = await api.get('/mood/unified', {
        params: { days: resolvedDays, includeAnalytics: false },
        signal: controller.signal,
      });

      console.log('useMoodInsights - API response:', response.data);

      let moodData = [];
      if (response.data.success || response.data.status === 'success') {
        moodData = response.data.data || [];
        console.log(
          'useMoodInsights - Extracted moodData (status=success):',
          moodData.length,
          'entries'
        );
      } else if (Array.isArray(response.data)) {
        // Handle case where API returns array directly
        moodData = response.data;
        console.log(
          'useMoodInsights - Extracted moodData (direct array):',
          moodData.length,
          'entries'
        );
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        moodData = response.data.data;
        console.log(
          'useMoodInsights - Extracted moodData (nested data):',
          moodData.length,
          'entries'
        );
      } else {
        console.warn('Mood history API returned unexpected format:', response.data);
      }

      console.log('useMoodInsights - Final moodData to set:', moodData.length, 'entries');
      if (moodData.length > 0) {
        console.log('useMoodInsights - First entry:', moodData[0]);
      }

      // Check if this controller is still the current one (not aborted by a new request)
      if (controllerRef.current !== controller) {
        console.log(
          'useMoodInsights - Controller was replaced by a new request, skipping state update'
        );
        return;
      }

      // Update state - React will handle cleanup if component unmounts
      console.log('useMoodInsights - About to set moodHistory with', moodData.length, 'entries');
      setMoodHistory(moodData);
      console.log('useMoodInsights - moodHistory state updated with', moodData.length, 'entries');
    } catch (error) {
      if (
        error?.name === 'AbortError' ||
        error?.name === 'CanceledError' ||
        error?.code === 'ERR_CANCELED'
      ) {
        if (isMountedRef.current && didTimeout) setError('Timed out loading mood insights');
        return;
      }
      console.error('Failed to fetch mood history:', error);
      if (!isMountedRef.current) return;
      setMoodHistory([]);
      setError('Failed to load mood insights');
      // Only show toast for non-abort errors
      if (error?.response?.status !== 401) {
        toast.error('Failed to load insights');
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      // Always clear loading state if component is still mounted
      if (isMountedRef.current) {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
        console.log('useMoodInsights - Finally block: setting isLoading to false');
        setIsLoading(false);
      }
    }
  }, [days, pageSize]);

  useEffect(() => {
    fetchMoodHistory();
    return () => controllerRef.current?.abort?.();
  }, [fetchMoodHistory]);

  const stats = useMemo(() => {
    const validEntries = moodHistory
      .map((entry) => {
        const rawMoodValue = entry?.moodValue ?? entry?.mood_value ?? entry?.value;
        const moodValue = typeof rawMoodValue === 'number' ? rawMoodValue : Number(rawMoodValue);
        return Number.isFinite(moodValue) ? { ...entry, moodValue } : null;
      })
      .filter(Boolean);
    if (validEntries.length === 0) return null;

    const total = validEntries.reduce((sum, entry) => sum + entry.moodValue, 0);
    const average = parseFloat((total / validEntries.length).toFixed(1));
    const latest = validEntries[0]?.moodValue ?? 0;
    const previous = validEntries[1]?.moodValue ?? latest;

    let trend = 'stable';
    if (latest > previous) trend = 'up';
    else if (latest < previous) trend = 'down';

    return { average, total: validEntries.length, trend, latest };
  }, [moodHistory]);

  return { moodHistory, isLoading, stats, error, refresh: fetchMoodHistory };
}
