'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import MoodCharts from '../components/MoodCharts';
import MoodHistory from '../components/MoodHistory';
import MoodInput from '../components/MoodInput';
import MoodStats from '../components/MoodStats';
import MoodWellnessTips from '../components/MoodWellnessTips';
import '../styles/Mood.css';

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const HISTORY_PAGE_SIZE = 30;

const Mood = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchMoodHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get(`${apiBase}/api/mood/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 0, size: HISTORY_PAGE_SIZE },
      });

      if (response.data.status === 'success') {
        setMoodHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch mood history:', error);
      toast.error('Failed to load mood history');
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMoodHistory();
  }, [fetchMoodHistory]);

  const handleMoodSubmit = async ({ value, notes }) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${apiBase}/api/mood/add`,
        {
          moodValue: value,
          notes: notes ?? null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === 'success') {
        toast.success('Mood entry saved successfully!');
        fetchMoodHistory();
        return;
      }

      throw new Error('Failed to save mood entry');
    } catch (error) {
      console.error('Failed to save mood:', error);
      toast.error('Failed to save mood entry');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (moodHistory.length === 0) return null;

    const total = moodHistory.reduce((sum, entry) => sum + entry.moodValue, 0);
    const average = (total / moodHistory.length).toFixed(1);
    const latest = moodHistory[0]?.moodValue || 0;
    const previous = moodHistory[1]?.moodValue || latest;

    let trend = 'stable';
    if (latest > previous) trend = 'up';
    else if (latest < previous) trend = 'down';

    return {
      average,
      total: moodHistory.length,
      trend,
      latest,
    };
  }, [moodHistory]);

  const currentMood = useMemo(() => {
    if (!stats?.latest) return null;

    const moodLookup = {
      1: { emoji: '😭', label: t('mood.terrible') },
      2: { emoji: '😢', label: t('mood.veryBad') },
      3: { emoji: '😔', label: t('mood.bad') },
      4: { emoji: '😕', label: t('mood.poor') },
      5: { emoji: '😐', label: t('mood.neutral') },
      6: { emoji: '🙂', label: t('mood.okay') },
      7: { emoji: '😊', label: t('mood.good') },
      8: { emoji: '😄', label: t('mood.veryGood') },
      9: { emoji: '😁', label: t('mood.great') },
      10: { emoji: '🤩', label: t('mood.amazing') },
    };

    const display = moodLookup[stats.latest];
    return display ? { value: stats.latest, ...display } : { value: stats.latest, emoji: '🙂' };
  }, [stats?.latest, t]);

  return (
    <div className="page mood-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('mood.title')}</h1>
          <p className="page-subtitle">{t('mood.subtitle')}</p>
        </div>

        <div className="mood-content">
          <div className="mood-entry-section">
            <MoodInput onSubmit={handleMoodSubmit} loading={loading} currentMood={currentMood} />
          </div>

          <div className="mood-insights">
            <MoodStats stats={stats} isLoading={historyLoading} />
            <MoodCharts moodHistory={moodHistory} isLoading={historyLoading} />
            <MoodHistory moodHistory={moodHistory} isLoading={historyLoading} />
          </div>

          <MoodWellnessTips />
        </div>
      </div>
    </div>
  );
};

export default Mood;
