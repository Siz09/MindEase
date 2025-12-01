import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Flame, Calendar } from 'lucide-react';
import '../../styles/mindfulness/StreakWidget.css';

const StreakWidget = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [streak, setStreak] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/mindfulness/streak');
      if (response.data.success) {
        setStreak(response.data.streak);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="streak-widget-loading">
        <div className="spinner-small"></div>
      </div>
    );
  }

  if (!streak) {
    return null;
  }

  return (
    <div className="streak-widget">
      <div className="streak-main">
        <div className="streak-icon">
          <Flame size={32} className={streak.isActive ? 'flame-active' : ''} />
        </div>
        <div className="streak-info">
          <div className="streak-value">{streak.currentStreak || 0}</div>
          <div className="streak-label">{t('mindfulness.streak.days', 'Day Streak')}</div>
        </div>
      </div>
      <div className="streak-details">
        <div className="streak-stat">
          <span className="stat-label">{t('mindfulness.streak.longest', 'Longest')}</span>
          <span className="stat-value">{streak.longestStreak || 0}</span>
        </div>
        <div className="streak-status">
          {streak.isActive ? (
            <span className="status-active">{t('mindfulness.streak.active', 'Active')}</span>
          ) : (
            <span className="status-inactive">
              {t('mindfulness.streak.startToday', 'Start your streak today!')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreakWidget;
