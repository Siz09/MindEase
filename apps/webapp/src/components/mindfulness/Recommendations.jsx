import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Heart, TrendingUp, Clock, Sparkles } from 'lucide-react';
import '../../styles/mindfulness/Recommendations.css';

const Recommendations = ({ onSessionSelect }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/mindfulness/recommendations');
      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (sessionId) => {
    try {
      const response = await api.post(`/mindfulness/sessions/${sessionId}/favorite`);
      if (response.data.success) {
        const newFavorites = new Set(favorites);
        if (response.data.isFavorite) {
          newFavorites.add(sessionId);
        } else {
          newFavorites.delete(sessionId);
        }
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'moodBased':
        return <Sparkles size={20} />;
      case 'continueJourney':
        return <TrendingUp size={20} />;
      case 'timeBased':
        return <Clock size={20} />;
      default:
        return null;
    }
  };

  const getRecommendationTitle = (type) => {
    switch (type) {
      case 'moodBased':
        return t('mindfulness.recommendations.moodBased', 'Based on Your Mood');
      case 'continueJourney':
        return t('mindfulness.recommendations.continueJourney', 'Continue Your Journey');
      case 'similarSessions':
        return t('mindfulness.recommendations.similarSessions', 'You Might Also Like');
      case 'timeBased':
        return t('mindfulness.recommendations.timeBased', 'Perfect for Now');
      case 'recommendedForYou':
        return t('mindfulness.recommendations.recommendedForYou', 'Recommended for You');
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="recommendations-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!recommendations || Object.keys(recommendations).length === 0) {
    return (
      <div className="recommendations-empty">
        <p>{t('mindfulness.recommendations.noRecommendations', 'No recommendations available.')}</p>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      {Object.entries(recommendations).map(([type, sessions]) => {
        if (!sessions || sessions.length === 0) return null;

        return (
          <div key={type} className="recommendation-section">
            <div className="recommendation-header">
              {getRecommendationIcon(type)}
              <h3>{getRecommendationTitle(type)}</h3>
            </div>
            <div className="recommendation-sessions">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="recommendation-session-card"
                  onClick={() => onSessionSelect && onSessionSelect(session)}
                >
                  <div className="session-card-header">
                    <span className="session-type">{session.type === 'audio' ? '🎵' : '🎨'}</span>
                    <button
                      className="favorite-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(session.id);
                      }}
                    >
                      <Heart
                        size={18}
                        fill={favorites.has(session.id) ? 'currentColor' : 'none'}
                        className={favorites.has(session.id) ? 'favorited' : ''}
                      />
                    </button>
                  </div>
                  <h4 className="session-title">{session.title}</h4>
                  <p className="session-description">{session.description}</p>
                  <div className="session-meta">
                    <span>⏱️ {session.duration} min</span>
                    <span>📁 {session.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Recommendations;
