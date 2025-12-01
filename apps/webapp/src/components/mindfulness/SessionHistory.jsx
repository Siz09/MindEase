import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Calendar, Clock, Star } from 'lucide-react';
import '../../styles/mindfulness/SessionHistory.css';

const SessionHistory = ({ limit = 20 }) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/mindfulness/history?limit=${limit}`);
      if (response.data.success) {
        setHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = i18n.language || 'en-US';
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredHistory = history.filter((activity) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'rated' && activity.rating) return true;
    if (selectedFilter === 'moodTracked' && activity.moodAfter) return true;
    return false;
  });

  if (isLoading) {
    return (
      <div className="session-history-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="session-history-empty">
        <Calendar size={48} className="empty-icon" />
        <h3>{t('mindfulness.history.noHistory', 'No session history yet')}</h3>
        <p>
          {t(
            'mindfulness.history.startPracticing',
            'Start practicing mindfulness to see your history here.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="session-history">
      <div className="history-header">
        <h2>{t('mindfulness.history.title', 'Session History')}</h2>
        <div className="history-filters">
          <button
            className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            {t('mindfulness.history.all', 'All')}
          </button>
          <button
            className={`filter-btn ${selectedFilter === 'rated' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('rated')}
          >
            {t('mindfulness.history.rated', 'Rated')}
          </button>
          <button
            className={`filter-btn ${selectedFilter === 'moodTracked' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('moodTracked')}
          >
            {t('mindfulness.history.moodTracked', 'Mood Tracked')}
          </button>
        </div>
      </div>

      <div className="history-list">
        {filteredHistory.map((activity) => (
          <div key={activity.id} className="history-item">
            <div className="history-item-header">
              <h4 className="session-title">{activity.session?.title || 'Unknown Session'}</h4>
              <span className="session-date">{formatDate(activity.completedAt)}</span>
            </div>
            <div className="history-item-details">
              <div className="detail-item">
                <Clock size={16} />
                <span>{activity.durationMinutes || activity.session?.duration || 0} min</span>
              </div>
              {activity.rating && (
                <div className="detail-item">
                  <Star size={16} fill="currentColor" />
                  <span>{activity.rating}/5</span>
                </div>
              )}
              {activity.moodBefore !== null && activity.moodAfter !== null && (
                <div className="detail-item mood-change">
                  <span>
                    {t('mindfulness.history.mood', 'Mood')}: {activity.moodBefore} →{' '}
                    {activity.moodAfter}
                  </span>
                  {activity.moodAfter > activity.moodBefore && (
                    <span className="mood-improvement">↗</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionHistory;
