import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import Lottie from 'lottie-react';
import '../styles/Mindfulness.css';

const Mindfulness = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [animationData, setAnimationData] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Fetch mindfulness sessions
  const fetchMindfulnessSessions = useCallback(async () => {
    try {
      // If offline, show cached data or empty state
      if (isOffline) {
        console.log('Offline mode: Using cached mindfulness sessions');
        // The service worker will handle caching, so we can still try to fetch
        // but show appropriate messaging
      }

      const response = await fetch('http://localhost:8080/api/mindfulness/list', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch mindfulness sessions');

      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
        setFilteredSessions(data.sessions);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching mindfulness sessions:', error);
      if (isOffline) {
        toast.info('Using cached mindfulness sessions. Some features may be limited offline.');
      } else {
        toast.error(t('mindfulness.errors.fetchFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, isOffline, t]);

  // Fetch animation data
  const fetchAnimationData = async (animationUrl) => {
    try {
      const response = await fetch(`http://localhost:8080${animationUrl}`);
      if (response.ok) {
        const data = await response.json();
        setAnimationData(data);
      }
    } catch (error) {
      console.error('Error fetching animation data:', error);
    }
  };

  // Filter sessions based on selected filters
  useEffect(() => {
    let filtered = sessions;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((session) => session.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((session) => session.type === selectedType);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((session) => session.difficultyLevel === selectedDifficulty);
    }

    setFilteredSessions(filtered);
  }, [selectedCategory, selectedType, selectedDifficulty, sessions]);

  // Handle audio playback
  const handleAudioPlay = (sessionId, audioUrl) => {
    if (playingAudio === sessionId) {
      // Stop audio if same session is clicked again
      setPlayingAudio(null);
    } else {
      // Play new audio
      setPlayingAudio(sessionId);
      setCurrentAnimation(null);

      // In a real app, you would use the Audio API here
      console.log('Playing audio:', audioUrl);
      toast.info(t('mindfulness.audioPlaying'));
    }
  };

  // Handle animation playback
  const handleAnimationPlay = (sessionId, animationUrl) => {
    if (currentAnimation === sessionId) {
      // Stop animation if same session is clicked again
      setCurrentAnimation(null);
      setAnimationData(null);
    } else {
      // Play new animation
      setCurrentAnimation(sessionId);
      setPlayingAudio(null);
      fetchAnimationData(animationUrl);
    }
  };

  // Format duration
  const formatDuration = (minutes) => {
    return `${minutes} ${t('mindfulness.minutes')}`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'audio':
        return '🎵';
      case 'animation':
        return '🎨';
      default:
        return '📱';
    }
  };

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchMindfulnessSessions();
  }, [fetchMindfulnessSessions]);

  if (isLoading) {
    return (
      <div className="mindfulness-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('mindfulness.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mindfulness-container">
      <div className="mindfulness-header">
        <h1>{t('mindfulness.title')}</h1>
        <p className="mindfulness-subtitle">{t('mindfulness.subtitle')}</p>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-number">{sessions.length}</div>
          <div className="stat-label">{t('mindfulness.totalSessions')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{sessions.filter((s) => s.type === 'audio').length}</div>
          <div className="stat-label">{t('mindfulness.audioSessions')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{sessions.filter((s) => s.type === 'animation').length}</div>
          <div className="stat-label">{t('mindfulness.animationSessions')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">{t('mindfulness.filterByCategory')}</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('mindfulness.allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">{t('mindfulness.filterByType')}</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('mindfulness.allTypes')}</option>
            <option value="audio">🎵 {t('mindfulness.audio')}</option>
            <option value="animation">🎨 {t('mindfulness.animation')}</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">{t('mindfulness.filterByDifficulty')}</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('mindfulness.allDifficulties')}</option>
            <option value="beginner">🟢 {t('mindfulness.beginner')}</option>
            <option value="intermediate">🟡 {t('mindfulness.intermediate')}</option>
            <option value="advanced">🔴 {t('mindfulness.advanced')}</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSelectedCategory('all');
            setSelectedType('all');
            setSelectedDifficulty('all');
          }}
          className="btn btn-outline clear-filters-btn"
        >
          {t('mindfulness.clearFilters')}
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="sessions-grid">
        {filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧘‍♂️</div>
            <h3>{t('mindfulness.noSessionsFound')}</h3>
            <p>{t('mindfulness.tryChangingFilters')}</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedDifficulty('all');
              }}
              className="btn btn-primary"
            >
              {t('mindfulness.showAllSessions')}
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <div className="session-type">{getTypeIcon(session.type)}</div>
                <div
                  className="session-difficulty"
                  style={{ backgroundColor: getDifficultyColor(session.difficultyLevel) }}
                >
                  {session.difficultyLevel}
                </div>
              </div>

              <div className="session-content">
                <h3 className="session-title">{session.title}</h3>
                <p className="session-description">{session.description}</p>

                <div className="session-meta">
                  <span className="session-duration">⏱️ {formatDuration(session.duration)}</span>
                  <span className="session-category">📁 {session.category}</span>
                </div>
              </div>

              <div className="session-actions">
                {session.type === 'audio' ? (
                  <button
                    onClick={() => handleAudioPlay(session.id, session.mediaUrl)}
                    className={`btn ${playingAudio === session.id ? 'btn-secondary' : 'btn-primary'} play-btn`}
                  >
                    {playingAudio === session.id ? '⏸️' : '▶️'}
                    {playingAudio === session.id
                      ? t('mindfulness.stopAudio')
                      : t('mindfulness.playAudio')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAnimationPlay(session.id, session.mediaUrl)}
                    className={`btn ${currentAnimation === session.id ? 'btn-secondary' : 'btn-primary'} play-btn`}
                  >
                    {currentAnimation === session.id ? '⏹️' : '🎬'}
                    {currentAnimation === session.id
                      ? t('mindfulness.stopAnimation')
                      : t('mindfulness.playAnimation')}
                  </button>
                )}
              </div>

              {/* Animation Display */}
              {currentAnimation === session.id && session.type === 'animation' && (
                <div className="animation-container">
                  {animationData ? (
                    <Lottie
                      animationData={animationData}
                      loop={true}
                      autoplay={true}
                      style={{ width: '100%', height: '200px' }}
                    />
                  ) : (
                    <div className="animation-placeholder">
                      <div className="loading-spinner-small"></div>
                      <p>{t('mindfulness.loadingAnimation')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Player Display */}
              {playingAudio === session.id && session.type === 'audio' && (
                <div className="audio-player">
                  <div className="audio-visualizer">
                    <div className="audio-bar"></div>
                    <div className="audio-bar"></div>
                    <div className="audio-bar"></div>
                    <div className="audio-bar"></div>
                    <div className="audio-bar"></div>
                  </div>
                  <p className="audio-playing-text">{t('mindfulness.audioPlayingHint')}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Access Section */}
      <div className="quick-access">
        <h2>{t('mindfulness.quickAccess')}</h2>
        <div className="quick-buttons">
          <button
            onClick={() => {
              setSelectedType('audio');
              setSelectedDifficulty('beginner');
              setSelectedCategory('all');
            }}
            className="quick-btn"
          >
            🎵 {t('mindfulness.beginnerAudio')}
          </button>
          <button
            onClick={() => {
              setSelectedType('animation');
              setSelectedDifficulty('beginner');
              setSelectedCategory('all');
            }}
            className="quick-btn"
          >
            🎨 {t('mindfulness.beginnerAnimations')}
          </button>
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedDifficulty('all');
              setSelectedCategory('breathing');
            }}
            className="quick-btn"
          >
            🌬️ {t('mindfulness.breathingExercises')}
          </button>
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedDifficulty('all');
              setSelectedCategory('quick');
            }}
            className="quick-btn"
          >
            ⚡ {t('mindfulness.quickSessions')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mindfulness;
