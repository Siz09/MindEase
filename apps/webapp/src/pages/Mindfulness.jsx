import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Lottie from 'lottie-react';
import { Heart } from 'lucide-react';
import '../styles/Mindfulness.css';
import GuidedProgramList from '../components/GuidedProgramList';
import BreathingTimer from '../components/mindfulness/BreathingTimer';
import MeditationTimer from '../components/mindfulness/MeditationTimer';
import MindfulnessAnalytics from '../components/mindfulness/MindfulnessAnalytics';
import Recommendations from '../components/mindfulness/Recommendations';
import StreakWidget from '../components/mindfulness/StreakWidget';
import FavoritesSection from '../components/mindfulness/FavoritesSection';
import SessionHistory from '../components/mindfulness/SessionHistory';

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

  // New state for Guided Programs
  const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'journey', 'tools', 'favorites'
  const [guidedPrograms, setGuidedPrograms] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [sessionCompletions, setSessionCompletions] = useState(new Set());

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

  // Fetch guided programs
  const fetchGuidedPrograms = useCallback(async () => {
    try {
      const res = await api.get('/guided-programs');
      if (res.data.success) {
        setGuidedPrograms(res.data.programs);
      }
    } catch (error) {
      console.error('Error fetching guided programs:', error);
    }
  }, []);

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
  const handleAudioPlay = async (sessionId, audioUrl, onComplete) => {
    if (!audioUrl) {
      toast.error(t('mindfulness.errors.noAudioUrl') || 'Audio URL not available');
      return;
    }

    // Build full URL - handle different URL formats
    let fullUrl;
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      fullUrl = audioUrl;
    } else if (audioUrl.startsWith('/media/')) {
      fullUrl = `${API_BASE}${audioUrl}`;
    } else if (audioUrl.startsWith('/')) {
      fullUrl = `${API_BASE}${audioUrl}`;
    } else {
      fullUrl = `${API_BASE}/media/audio/${audioUrl}`;
    }

    if (playingAudio === sessionId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setPlayingAudio(null);
      return;
    }

    // Stop any previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      const src = audioRef.current.src;
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
      audioRef.current = null;
    }

    try {
      if (isOffline) {
        const match = await caches.match(fullUrl);
        if (!match) {
          toast.info(t('mindfulness.offlineNoAudio') || 'Audio not available offline.');
          return;
        }
        const blob = await match.blob();
        const blobUrl = URL.createObjectURL(blob);
        audioRef.current = new Audio(blobUrl);
      } else {
        // Create audio element with better error handling
        audioRef.current = new Audio(fullUrl);

        // Add canplaythrough event to verify audio can load
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio load timeout'));
          }, 10000); // 10 second timeout

          audioRef.current.addEventListener(
            'canplaythrough',
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );

          audioRef.current.addEventListener(
            'error',
            (e) => {
              clearTimeout(timeout);
              reject(new Error('Audio load failed'));
            },
            { once: true }
          );

          // Start loading
          audioRef.current.load();
        });
      }

      // Set up event handlers
      audioRef.current.onended = async () => {
        setPlayingAudio(null);
        if (audioRef.current) {
          const src = audioRef.current.src;
          if (src.startsWith('blob:')) {
            URL.revokeObjectURL(src);
          }
          audioRef.current = null;
        }
        // Call completion callback if provided
        if (onComplete) {
          try {
            await onComplete();
          } catch (error) {
            console.error('onComplete failed', error);
          }
        }
      };

      audioRef.current.onerror = (e) => {
        console.error('Audio playback error', e);
        const errorMsg = audioRef.current?.error
          ? `Error ${audioRef.current.error.code}: ${getAudioErrorText(audioRef.current.error.code)}`
          : t('mindfulness.errors.audioPlay') || 'Playback error';
        toast.error(errorMsg);
        setPlayingAudio(null);
        if (audioRef.current) {
          const src = audioRef.current.src;
          if (src.startsWith('blob:')) {
            URL.revokeObjectURL(src);
          }
          audioRef.current = null;
        }
      };

      // Attempt to play
      try {
        await audioRef.current.play();
        setPlayingAudio(sessionId);
        setCurrentAnimation(null);
        setAnimationData(null);
      } catch (playErr) {
        console.error('Play promise failed', playErr);
        throw playErr;
      }
    } catch (err) {
      console.error('Audio playback failed', err);
      const errorMsg =
        err.message === 'Audio load failed'
          ? t('mindfulness.errors.audioLoadFailed') ||
            'Unable to load audio file. Please check the file format and URL.'
          : t('mindfulness.errors.audioPlay') || 'Playback error';
      toast.error(errorMsg);
      setPlayingAudio(null);
      if (audioRef.current) {
        const src = audioRef.current.src;
        if (src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
        audioRef.current = null;
      }
    }
  };

  // Helper function for audio error codes
  const getAudioErrorText = (code) => {
    switch (code) {
      case 1:
        return 'MEDIA_ERR_ABORTED - Audio loading aborted';
      case 2:
        return 'MEDIA_ERR_NETWORK - Network error loading audio';
      case 3:
        return 'MEDIA_ERR_DECODE - Audio decoding error';
      case 4:
        return 'MEDIA_ERR_SRC_NOT_SUPPORTED - Audio format not supported';
      default:
        return 'Unknown audio error';
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
    fetchGuidedPrograms();
  }, [fetchMindfulnessSessions, fetchGuidedPrograms]);

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

      {/* Tabs */}
      <div className="mindfulness-tabs">
        <button
          className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          {t('mindfulness.tabs.discover', 'Discover')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
          onClick={() => setActiveTab('journey')}
        >
          {t('mindfulness.tabs.journey', 'My Journey')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          {t('mindfulness.tabs.tools', 'Guided Tools')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          {t('mindfulness.tabs.favorites', 'Favorites')}
        </button>
      </div>

      {activeTab === 'discover' && (
        <>
          <StreakWidget />
          <Recommendations
            onSessionSelect={(session) => {
              // Scroll to session or handle selection
              const sessionElement = document.querySelector(`[data-session-id="${session.id}"]`);
              if (sessionElement) {
                sessionElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />

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
              <div className="stat-number">
                {sessions.filter((s) => s.type === 'animation').length}
              </div>
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
                <div key={session.id} className="session-card" data-session-id={session.id}>
                  <div className="session-header">
                    <div className="session-type">{getTypeIcon(session.type)}</div>
                    <div className="session-header-right">
                      {sessionCompletions.has(session.id) && (
                        <span className="completion-badge">✓</span>
                      )}
                      <button
                        className="favorite-btn-header"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const response = await api.post(
                              `/mindfulness/sessions/${session.id}/favorite`
                            );
                            if (response.data.success) {
                              const newFavorites = new Set(favorites);
                              if (response.data.isFavorite) {
                                newFavorites.add(session.id);
                                toast.success(
                                  t('mindfulness.addedToFavorites', 'Added to favorites')
                                );
                              } else {
                                newFavorites.delete(session.id);
                                toast.info(
                                  t('mindfulness.removedFromFavorites', 'Removed from favorites')
                                );
                              }
                              setFavorites(newFavorites);
                            }
                          } catch (error) {
                            console.error('Error toggling favorite:', error);
                          }
                        }}
                      >
                        <Heart
                          size={18}
                          fill={favorites.has(session.id) ? 'currentColor' : 'none'}
                          className={favorites.has(session.id) ? 'favorited' : ''}
                        />
                      </button>
                      <div
                        className="session-difficulty"
                        style={{ backgroundColor: getDifficultyColor(session.difficultyLevel) }}
                      >
                        {session.difficultyLevel}
                      </div>
                    </div>
                  </div>

                  <div className="session-content">
                    <h3 className="session-title">{session.title}</h3>
                    <p className="session-description">{session.description}</p>

                    <div className="session-meta">
                      <span className="session-duration">
                        ⏱️ {formatDuration(session.duration)}
                      </span>
                      <span className="session-category">📁 {session.category}</span>
                    </div>
                  </div>

                  <div className="session-actions">
                    {session.type === 'audio' ? (
                      <button
                        onClick={async () => {
                          const sessionId = session.id;
                          const onComplete = async () => {
                            try {
                              await api.post(`/mindfulness/sessions/${sessionId}/complete`, {
                                durationMinutes: session.duration,
                              });
                              setSessionCompletions((prev) => new Set(prev).add(sessionId));
                            } catch (error) {
                              console.error('Error recording completion:', error);
                            }
                          };
                          await handleAudioPlay(sessionId, session.mediaUrl, onComplete);
                        }}
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
        </>
      )}

      {activeTab === 'journey' && (
        <>
          <MindfulnessAnalytics />
          <SessionHistory />
        </>
      )}

      {activeTab === 'tools' && (
        <div className="guided-tools-section">
          <div className="tools-grid">
            <div className="tool-card">
              <h3>{t('mindfulness.tools.breathing', 'Breathing Exercise')}</h3>
              <BreathingTimer
                onComplete={async (data) => {
                  toast.success(
                    t('mindfulness.breathing.completed', 'Breathing exercise completed!')
                  );
                  // Could track this as a session completion
                }}
              />
            </div>
            <div className="tool-card">
              <h3>{t('mindfulness.tools.meditation', 'Meditation Timer')}</h3>
              <MeditationTimer
                onComplete={async (data) => {
                  toast.success(t('mindfulness.meditation.completed', 'Meditation completed!'));
                  // Track completion
                  try {
                    // Create a virtual session for meditation timer
                    await api.post('/mindfulness/sessions/virtual/complete', {
                      durationMinutes: data.presetDuration,
                      type: 'meditation',
                    });
                  } catch (error) {
                    console.error('Error tracking meditation:', error);
                  }
                }}
                onMoodCheckIn={(type, moodOrCallback, data) => {
                  // Handle mood check-in with flexible signature
                  // For 'pre' flow: moodOrCallback is a callback function
                  // For 'post' flow: moodOrCallback is the mood value, data contains additional info
                  if (typeof moodOrCallback === 'function') {
                    // Pre-flow: callback function provided
                    moodOrCallback(data?.mood || data);
                  } else if (moodOrCallback !== undefined) {
                    // Post-flow: mood value provided
                    console.log('Mood check-in:', { type, mood: moodOrCallback, data });
                  }
                }}
              />
            </div>
          </div>
          <div className="exercises-section">
            <h3>{t('mindfulness.exercises', 'Guided Programs')}</h3>
            <GuidedProgramList programs={guidedPrograms} />
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <FavoritesSection
          onSessionSelect={(session) => {
            // Handle session selection from favorites
            console.log('Selected favorite session:', session);
          }}
        />
      )}
    </div>
  );
};

export default Mindfulness;
