'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ChatBot from '../components/ChatBot';
import '../styles/Mood.css';

const Mood = () => {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showChatBot, setShowChatBot] = useState(false);

  const moods = [
    { id: 'excellent', emoji: '😊', label: t('mood.excellent'), color: '#16a34a', value: 5 },
    { id: 'good', emoji: '🙂', label: t('mood.good'), color: '#84cc16', value: 4 },
    { id: 'okay', emoji: '😐', label: t('mood.okay'), color: '#eab308', value: 3 },
    { id: 'low', emoji: '😔', label: t('mood.low'), color: '#f97316', value: 2 },
    { id: 'terrible', emoji: '😢', label: t('mood.terrible'), color: '#dc2626', value: 1 },
  ];

  useEffect(() => {
    // Load mood history from localStorage
    const savedHistory = localStorage.getItem('moodHistory');
    if (savedHistory) {
      setMoodHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);

    const newEntry = {
      id: Date.now(),
      mood: mood,
      date: currentDate.toISOString(),
      timestamp: new Date().toLocaleString(),
    };

    const updatedHistory = [newEntry, ...moodHistory.slice(0, 6)]; // Keep last 7 entries
    setMoodHistory(updatedHistory);
    localStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
  };

  const getMoodStats = () => {
    if (moodHistory.length === 0) return null;

    const total = moodHistory.reduce((sum, entry) => sum + entry.mood.value, 0);
    const average = (total / moodHistory.length).toFixed(1);

    return {
      average,
      total: moodHistory.length,
      trend:
        moodHistory.length > 1
          ? moodHistory[0].mood.value > moodHistory[1].mood.value
            ? 'up'
            : moodHistory[0].mood.value < moodHistory[1].mood.value
              ? 'down'
              : 'stable'
          : 'stable',
    };
  };

  const stats = getMoodStats();

  return (
    <div className="page mood-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('mood.title')}</h1>
          <p className="page-subtitle">{t('mood.subtitle')}</p>
        </div>

        <div className="mood-content">
          {/* Current Mood Selection */}
          <div className="mood-selector-section">
            <div className="card mood-selector-card">
              <div className="card-header">
                <h2 className="card-title">{t('mood.howAreYouFeeling')}</h2>
                <p className="card-description">{t('mood.selectMoodDescription')}</p>
              </div>

              <div className="mood-options">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    className={`mood-option ${selectedMood?.id === mood.id ? 'selected' : ''}`}
                    onClick={() => handleMoodSelect(mood)}
                    style={{ '--mood-color': mood.color }}
                  >
                    <div className="mood-emoji">{mood.emoji}</div>
                    <span className="mood-label">{mood.label}</span>
                  </button>
                ))}
              </div>

              {selectedMood && (
                <div className="mood-confirmation">
                  <div className="confirmation-content">
                    <div
                      className="confirmation-icon"
                      style={{ backgroundColor: selectedMood.color }}
                    >
                      {selectedMood.emoji}
                    </div>
                    <div className="confirmation-text">
                      <h3>{t('mood.moodRecorded')}</h3>
                      <p>{t('mood.moodRecordedDescription', { mood: selectedMood.label })}</p>
                    </div>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setShowChatBot(true)}>
                    {t('mood.talkAboutIt')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mood Statistics and History */}
          <div className="mood-insights">
            {stats && (
              <div className="card stats-card">
                <div className="card-header">
                  <h3 className="card-title">{t('mood.insights')}</h3>
                </div>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{stats.average}</div>
                    <div className="stat-label">{t('mood.averageMood')}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">{t('mood.entriesLogged')}</div>
                  </div>
                  <div className="stat-item">
                    <div className={`stat-value trend-${stats.trend}`}>
                      {stats.trend === 'up' ? '↗' : stats.trend === 'down' ? '↘' : '→'}
                    </div>
                    <div className="stat-label">{t('mood.trend')}</div>
                  </div>
                </div>
              </div>
            )}

            {moodHistory.length > 0 && (
              <div className="card history-card">
                <div className="card-header">
                  <h3 className="card-title">{t('mood.recentMoods')}</h3>
                </div>
                <div className="mood-history">
                  {moodHistory.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="history-item">
                      <div className="history-mood">
                        <span className="history-emoji">{entry.mood.emoji}</span>
                        <span className="history-label">{entry.mood.label}</span>
                      </div>
                      <div className="history-time">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Wellness Tips */}
          <div className="card tips-card">
            <div className="card-header">
              <h3 className="card-title">{t('mood.wellnessTips')}</h3>
            </div>
            <div className="tips-grid">
              <div className="tip-item">
                <div className="tip-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 9v9h6v-6h6v6h6V9l-9-7z" fill="var(--primary-green)" />
                  </svg>
                </div>
                <div className="tip-content">
                  <h4>{t('mood.tip1Title')}</h4>
                  <p>{t('mood.tip1Description')}</p>
                </div>
              </div>
              <div className="tip-item">
                <div className="tip-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="var(--primary-green)" strokeWidth="2" />
                    <path d="M8 12l2 2 4-4" stroke="var(--primary-green)" strokeWidth="2" />
                  </svg>
                </div>
                <div className="tip-content">
                  <h4>{t('mood.tip2Title')}</h4>
                  <p>{t('mood.tip2Description')}</p>
                </div>
              </div>
              <div className="tip-item">
                <div className="tip-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                      stroke="var(--primary-green)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="tip-content">
                  <h4>{t('mood.tip3Title')}</h4>
                  <p>{t('mood.tip3Description')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ChatBot Integration */}
        {showChatBot && <ChatBot />}
      </div>
    </div>
  );
};

export default Mood;
