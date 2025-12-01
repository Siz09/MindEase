import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Heart } from 'lucide-react';
import '../../styles/mindfulness/FavoritesSection.css';

const FavoritesSection = ({ onSessionSelect }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [favoriteSessions, setFavoriteSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteSessions();
  }, []);

  const fetchFavoriteSessions = async () => {
    try {
      setIsLoading(true);
      // Fetch all sessions and filter favorites on client side for now
      // In production, you'd have a dedicated endpoint
      const response = await api.get('/mindfulness/list');
      if (response.data.success) {
        // For now, we'll need to track favorites separately
        // This is a simplified version
        setFavoriteSessions([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (sessionId) => {
    try {
      const response = await api.post(`/mindfulness/sessions/${sessionId}/favorite`);
      if (response.data.success) {
        setFavoriteSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="favorites-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (favoriteSessions.length === 0) {
    return (
      <div className="favorites-empty">
        <Heart size={48} className="empty-icon" />
        <h3>{t('mindfulness.favorites.noFavorites', 'No favorites yet')}</h3>
        <p>{t('mindfulness.favorites.addFavorites', 'Start adding sessions to your favorites!')}</p>
      </div>
    );
  }

  return (
    <div className="favorites-section">
      <h2 className="favorites-title">{t('mindfulness.favorites.title', 'Your Favorites')}</h2>
      <div className="favorites-grid">
        {favoriteSessions.map((session) => (
          <div
            key={session.id}
            className="favorite-session-card"
            onClick={() => onSessionSelect && onSessionSelect(session)}
          >
            <div className="session-card-header">
              <span className="session-type">{session.type === 'audio' ? '🎵' : '🎨'}</span>
              <button
                className="favorite-btn active"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(session.id);
                }}
              >
                <Heart size={18} fill="currentColor" />
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
};

export default FavoritesSection;
