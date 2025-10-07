import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Lottie from 'lottie-react';
import '../styles/Mindfulness.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

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
  const audioRef = useRef(null);

  // 🧩 API integration state (for future use)
  // const [selectedSession, setSelectedSession] = useState(null);
  // const [loading, setLoading] = useState(false);

  // helper: try reading from cache if available
  const readFromCache = async (url) => {
    if (!('caches' in window)) return null;
    try {
      const match = await caches.match(url);
      if (!match) return null;
      const cached = await match.json();
      return cached;
    } catch {
      return null;
    }
  };

  // Fetch mindfulness sessions (with offline cache fallback and resilient shape)
  const fetchMindfulnessSessions = useCallback(async () => {
    const url = `${API_BASE}/api/mindfulness/list`;
    try {
      if (isOffline) {
        const cached = await readFromCache(url);
        if (cached) {
          const sessionsPayload = cached.sessions || cached;
          setSessions(sessionsPayload);
          setFilteredSessions(sessionsPayload);
          setCategories(cached.categories || []);
          setIsLoading(false);
          toast.info(t('mindfulness.cachedLoaded') || 'Loaded cached sessions (offline).');
          return;
        } else {
          toast.info('Offline — no cached mindfulness sessions available.');
        }
      }

      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch mindfulness sessions');

      const data = await response.json();
      const sessionsPayload = data.sessions ?? (data.success ? data.sessions : data);
      setSessions(sessionsPayload);
      setFilteredSessions(sessionsPayload);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching mindfulness sessions:', error);
      if (!isOffline) {
        toast.error(t('mindfulness.errors.fetchFailed') || 'Failed to load mindfulness sessions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, isOffline, t]);

  // Fetch animation data (with offline cache fallback)
  const fetchAnimationData = async (animationUrl) => {
    const fullUrl = animationUrl.startsWith('http') ? animationUrl : `${API_BASE}${animationUrl}`;
    try {
      if (isOffline) {
        const cached = await readFromCache(fullUrl);
        if (cached) {
          setAnimationData(cached);
          return;
        }
      }

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load animation');

      const data = await response.json();
      setAnimationData(data);
    } catch (error) {
      console.error('Error fetching animation data:', error);
      toast.error(t('mindfulness.errors.animationLoad') || 'Failed to load animation');
      setAnimationData(null);
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

  // Handle audio playback with HTMLAudioElement and cache fallback
  const handleAudioPlay = async (sessionId, audioUrl) => {
    const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${API_BASE}${audioUrl}`;

    if (playingAudio === sessionId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingAudio(null);
      return;
    }

    // stop any previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (isOffline) {
      try {
        const match = await caches.match(fullUrl);
        if (!match) {
          toast.info(t('mindfulness.offlineNoAudio') || 'Audio not available offline.');
          return;
        }
        const blob = await match.blob();
        const blobUrl = URL.createObjectURL(blob);
        audioRef.current = new Audio(blobUrl);
      } catch {
        toast.info(t('mindfulness.offlineNoAudio') || 'Audio not available offline.');
        return;
      }
    } else {
      audioRef.current = new Audio(fullUrl);
    }

    audioRef.current.onended = () => setPlayingAudio(null);
    audioRef.current.onerror = (e) => {
      console.error('Audio playback error', e);
      toast.error(t('mindfulness.errors.audioPlay') || 'Playback error');
      setPlayingAudio(null);
    };

    try {
      await audioRef.current.play();
      setPlayingAudio(sessionId);
      setCurrentAnimation(null);
      setAnimationData(null);
      toast.info(t('mindfulness.audioPlaying'));
    } catch (err) {
      console.error('Play promise failed', err);
      toast.error(t('mindfulness.errors.audioPlay') || 'Playback error');
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

  // 🧩 Handle session selection with API integration (for future use)
  // const handleSessionSelect = async (session) => {
  //   setSelectedSession(session);
  //   setAnimationData(null);
  //   setLoading(true);
  //   try {
  //     const res = await api.get(`/api/mindfulness/${session.id}`);
  //     if (session.type === "animation") {
  //       const anim = await fetch(res.data.url).then(r => r.json());
  //       setAnimationData(anim);
  //     } else if (session.type === "audio") {
  //       const audio = new Audio(res.data.url);
  //       audio.play();
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Could not load session");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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

  // 🧩 Load sessions with API integration
  useEffect(() => {
    api
      .get('/api/mindfulness/list')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setSessions(res.data);
          setFilteredSessions(res.data);
        }
      })
      .catch(() => toast.error('Failed to load mindfulness sessions'));
  }, []);

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
