import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Recommendations from './Recommendations';
import StreakWidget from './StreakWidget';
import MindfulnessQuickStats from './MindfulnessQuickStats';
import MindfulnessSessionFilters from './MindfulnessSessionFilters';
import MindfulnessSessionsGrid from './MindfulnessSessionsGrid';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const MindfulnessDashboard = () => {
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
  const [favorites, setFavorites] = useState(new Set());
  const [sessionCompletions, setSessionCompletions] = useState(new Set());

  const audioRef = useRef(null);

  const readFromCache = useCallback(async (url) => {
    if (!('caches' in window)) return null;
    try {
      const match = await caches.match(url);
      if (!match) return null;
      const cached = await match.json();
      return cached;
    } catch {
      return null;
    }
  }, []);

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
          toast.info(t('mindfulness.cachedLoaded') || 'Loaded cached sessions (offline).');
          return;
        }
        toast.info('Offline — no cached mindfulness sessions available.');
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch mindfulness sessions');
      const data = await response.json();
      const sessionsPayload = data.sessions ?? data;
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
  }, [isOffline, readFromCache, t, token]);

  const fetchAnimationData = useCallback(
    async (animationUrl) => {
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
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
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
    },
    [isOffline, readFromCache, t, token]
  );

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

  const clearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedDifficulty('all');
  }, []);

  const toggleFavorite = useCallback(
    async (sessionId) => {
      try {
        const response = await api.post(`/mindfulness/sessions/${sessionId}/favorite`);
        if (!response.data.success) return;

        setFavorites((prev) => {
          const next = new Set(prev);
          if (response.data.isFavorite) {
            next.add(sessionId);
            toast.success(t('mindfulness.addedToFavorites', 'Added to favorites'));
          } else {
            next.delete(sessionId);
            toast.info(t('mindfulness.removedFromFavorites', 'Removed from favorites'));
          }
          return next;
        });
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    },
    [t]
  );

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

  const stopAndCleanupAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    const src = audioRef.current.src;
    if (src?.startsWith('blob:')) {
      URL.revokeObjectURL(src);
    }
    audioRef.current = null;
  }, []);

  const handleAudioPlay = async (sessionId, audioUrl, onComplete) => {
    if (!audioUrl) {
      toast.error(t('mindfulness.errors.noAudioUrl') || 'Audio URL not available');
      return;
    }

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
      stopAndCleanupAudio();
      setPlayingAudio(null);
      return;
    }

    stopAndCleanupAudio();

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
        audioRef.current = new Audio(fullUrl);

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Audio load timeout')), 10000);

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
            () => {
              clearTimeout(timeout);
              reject(new Error('Audio load failed'));
            },
            { once: true }
          );

          audioRef.current.load();
        });
      }

      audioRef.current.onended = async () => {
        setPlayingAudio(null);
        stopAndCleanupAudio();
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
        stopAndCleanupAudio();
      };

      await audioRef.current.play();
      setPlayingAudio(sessionId);
      setCurrentAnimation(null);
      setAnimationData(null);
    } catch (err) {
      console.error('Audio playback failed', err);
      const errorMsg =
        err.message === 'Audio load failed'
          ? t('mindfulness.errors.audioLoadFailed') ||
            'Unable to load audio file. Please check the file format and URL.'
          : t('mindfulness.errors.audioPlay') || 'Playback error';
      toast.error(errorMsg);
      setPlayingAudio(null);
      stopAndCleanupAudio();
    }
  };

  const handleAnimationPlay = useCallback(
    (sessionId, animationUrl) => {
      if (currentAnimation === sessionId) {
        setCurrentAnimation(null);
        setAnimationData(null);
        return;
      }

      setCurrentAnimation(sessionId);
      setPlayingAudio(null);
      stopAndCleanupAudio();
      fetchAnimationData(animationUrl);
    },
    [currentAnimation, fetchAnimationData, stopAndCleanupAudio]
  );

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

  useEffect(() => {
    fetchMindfulnessSessions();
  }, [fetchMindfulnessSessions]);

  useEffect(() => {
    return () => {
      stopAndCleanupAudio();
    };
  }, [stopAndCleanupAudio]);

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>{t('mindfulness.loading')}</p>
      </div>
    );
  }

  return (
    <>
      <StreakWidget />
      <Recommendations
        onSessionSelect={(session) => {
          const sessionElement = document.querySelector(
            `[data-session-id="${CSS.escape(session.id)}"]`
          );
          if (sessionElement) {
            sessionElement.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      <MindfulnessQuickStats sessions={sessions} />

      <MindfulnessSessionFilters
        categories={categories}
        selectedCategory={selectedCategory}
        selectedType={selectedType}
        selectedDifficulty={selectedDifficulty}
        onCategoryChange={(e) => setSelectedCategory(e.target.value)}
        onTypeChange={(e) => setSelectedType(e.target.value)}
        onDifficultyChange={(e) => setSelectedDifficulty(e.target.value)}
        onClear={clearFilters}
      />

      <MindfulnessSessionsGrid
        sessions={filteredSessions}
        favorites={favorites}
        sessionCompletions={sessionCompletions}
        playingAudioId={playingAudio}
        currentAnimationId={currentAnimation}
        animationData={animationData}
        onToggleFavorite={toggleFavorite}
        onPlayAudio={async (session) => {
          try {
            const onComplete = async () => {
              try {
                await api.post(`/mindfulness/sessions/${session.id}/complete`, {
                  durationMinutes: session.duration,
                });
                setSessionCompletions((prev) => new Set(prev).add(session.id));
              } catch (error) {
                console.error('Error recording completion:', error);
              }
            };
            await handleAudioPlay(session.id, session.mediaUrl, onComplete);
          } catch (error) {
            console.error('Audio play failed:', error);
          }
        }}
        onPlayAnimation={(session) => handleAnimationPlay(session.id, session.mediaUrl)}
        onShowAllSessions={clearFilters}
      />
    </>
  );
};

export default MindfulnessDashboard;
