import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function useMoodInsights({ pageSize = 100 } = {}) {
  const [moodHistory, setMoodHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMoodHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/mood/history', {
        params: { page: 0, size: pageSize },
      });

      if (response.data.success || response.data.status === 'success') {
        setMoodHistory(response.data.data || []);
      } else {
        console.warn('Mood history API returned unsuccessful response:', response.data);
        setMoodHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch mood history:', error);
      toast.error('Failed to load insights');
      setMoodHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchMoodHistory();
  }, [fetchMoodHistory]);

  const stats = useMemo(() => {
    const validEntries = moodHistory.filter((e) => typeof e.moodValue === 'number');
    if (validEntries.length === 0) return null;

    const total = validEntries.reduce((sum, entry) => sum + entry.moodValue, 0);
    const average = (total / validEntries.length).toFixed(1);
    const latest = validEntries[0]?.moodValue ?? 0;
    const previous = validEntries[1]?.moodValue ?? latest;

    let trend = 'stable';
    if (latest > previous) trend = 'up';
    else if (latest < previous) trend = 'down';

    return { average, total: validEntries.length, trend, latest };
  }, [moodHistory]);

  return { moodHistory, isLoading, stats, refresh: fetchMoodHistory };
}
