'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import '../styles/Mood.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Mood = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const moods = [
    { id: 1, emoji: '😢', label: t('mood.terrible'), color: '#dc2626', value: 1 },
    { id: 2, emoji: '😔', label: t('mood.low'), color: '#f97316', value: 2 },
    { id: 3, emoji: '😐', label: t('mood.okay'), color: '#eab308', value: 3 },
    { id: 4, emoji: '🙂', label: t('mood.good'), color: '#84cc16', value: 4 },
    { id: 5, emoji: '😊', label: t('mood.excellent'), color: '#16a34a', value: 5 },
  ];

  // Extended mood scale for more granular tracking
  const detailedMoods = [
    { value: 1, emoji: '😭', label: 'Terrible', color: '#dc2626' },
    { value: 2, emoji: '😢', label: 'Very Bad', color: '#ea580c' },
    { value: 3, emoji: '😔', label: 'Bad', color: '#f97316' },
    { value: 4, emoji: '😕', label: 'Poor', color: '#fb923c' },
    { value: 5, emoji: '😐', label: 'Neutral', color: '#eab308' },
    { value: 6, emoji: '🙂', label: 'Okay', color: '#a3e635' },
    { value: 7, emoji: '😊', label: 'Good', color: '#84cc16' },
    { value: 8, emoji: '😄', label: 'Very Good', color: '#65a30d' },
    { value: 9, emoji: '😁', label: 'Great', color: '#16a34a' },
    { value: 10, emoji: '🤩', label: 'Amazing', color: '#15803d' },
  ];

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get('http://localhost:8080/api/mood/history', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 0, size: 30 } // Get last 30 entries
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
  };

  const handleMoodSubmit = async () => {
    if (!selectedMood) {
      toast.error('Please select a mood level');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8080/api/mood/add',
        {
          moodValue: selectedMood.value,
          notes: notes.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === 'success') {
        toast.success('Mood entry saved successfully!');
        setSelectedMood(null);
        setNotes('');
        setShowForm(false);
        fetchMoodHistory(); // Refresh the history
      }
    } catch (error) {
      console.error('Failed to save mood:', error);
      toast.error('Failed to save mood entry');
    } finally {
      setLoading(false);
    }
  };

  const getMoodStats = () => {
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
  };

  const getChartData = () => {
    if (moodHistory.length === 0) return null;

    // Reverse to show chronological order
    const sortedHistory = [...moodHistory].reverse();
    
    return {
      labels: sortedHistory.map(entry => 
        new Date(entry.createdAt).toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric' 
        })
      ),
      datasets: [
        {
          label: 'Mood Level',
          data: sortedHistory.map(entry => entry.moodValue),
          borderColor: 'rgb(21, 128, 61)',
          backgroundColor: 'rgba(21, 128, 61, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: sortedHistory.map(entry => {
            const mood = detailedMoods.find(m => m.value === entry.moodValue);
            return mood?.color || 'rgb(21, 128, 61)';
          }),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    };
  };

  const getMoodDistribution = () => {
    if (moodHistory.length === 0) return null;

    const distribution = detailedMoods.map(mood => ({
      ...mood,
      count: moodHistory.filter(entry => entry.moodValue === mood.value).length,
    }));

    return {
      labels: distribution.map(d => `${d.emoji} ${d.label}`),
      datasets: [
        {
          label: 'Frequency',
          data: distribution.map(d => d.count),
          backgroundColor: distribution.map(d => d.color),
          borderColor: distribution.map(d => d.color),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Mood Trend Over Time',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#15803d',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            const mood = detailedMoods.find(m => m.value === value);
            return mood ? `${mood.emoji} ${value}` : value;
          },
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Mood Distribution',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#15803d',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const stats = getMoodStats();
  const chartData = getChartData();
  const distributionData = getMoodDistribution();

  return (
    <div className="page mood-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('mood.title')}</h1>
          <p className="page-subtitle">{t('mood.subtitle')}</p>
        </div>

        <div className="mood-content">
          {/* Quick Mood Entry */}
          <div className="mood-entry-section">
            <div className="card mood-entry-card">
              <div className="card-header">
                <h2 className="card-title">{t('mood.howAreYouFeeling')}</h2>
                <p className="card-description">Track your mood with a quick entry or detailed form</p>
              </div>

              {!showForm ? (
                <div className="quick-mood-selector">
                  <div className="mood-options-quick">
                    {moods.map((mood) => (
                      <button
                        key={mood.id}
                        className="mood-option-quick"
                        onClick={() => {
                          setSelectedMood({ value: mood.value * 2, emoji: mood.emoji, label: mood.label });
                          handleMoodSubmit();
                        }}
                        disabled={loading}
                        style={{ '--mood-color': mood.color }}
                      >
                        <div className="mood-emoji-large">{mood.emoji}</div>
                        <span className="mood-label-small">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => setShowForm(true)}
                    >
                      Detailed Entry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="detailed-mood-form">
                  <div className="mood-scale">
                    <h3>Rate your mood (1-10)</h3>
                    <div className="mood-scale-options">
                      {detailedMoods.map((mood) => (
                        <button
                          key={mood.value}
                          className={`mood-scale-option ${selectedMood?.value === mood.value ? 'selected' : ''}`}
                          onClick={() => setSelectedMood(mood)}
                          style={{ '--mood-color': mood.color }}
                        >
                          <div className="mood-emoji">{mood.emoji}</div>
                          <div className="mood-value">{mood.value}</div>
                          <div className="mood-label-tiny">{mood.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mood-notes">
                    <label htmlFor="notes" className="form-label">
                      Notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How are you feeling? What's on your mind?"
                      className="form-textarea"
                      rows="3"
                      maxLength="500"
                    />
                    <div className="character-count">
                      {notes.length}/500 characters
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedMood(null);
                        setNotes('');
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleMoodSubmit}
                      disabled={loading || !selectedMood}
                    >
                      {loading ? 'Saving...' : 'Save Mood'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mood Statistics and Visualization */}
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

            {/* Mood Trend Chart */}
            {chartData && (
              <div className="card chart-card">
                <div className="chart-container">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Mood Distribution Chart */}
            {distributionData && (
              <div className="card chart-card">
                <div className="chart-container">
                  <Bar data={distributionData} options={barChartOptions} />
                </div>
              </div>
            )}

            {/* Recent Mood History */}
            {moodHistory.length > 0 && (
              <div className="card history-card">
                <div className="card-header">
                  <h3 className="card-title">{t('mood.recentMoods')}</h3>
                </div>
                <div className="mood-history">
                  {historyLoading ? (
                    <div className="loading-state">Loading mood history...</div>
                  ) : (
                    moodHistory.slice(0, 10).map((entry) => {
                      const mood = detailedMoods.find(m => m.value === entry.moodValue);
                      const isAutoGenerated = entry.notes && entry.notes.includes('Automatic daily mood');
                      
                      return (
                        <div key={entry.id} className={`history-item ${isAutoGenerated ? 'auto-generated' : ''}`}>
                          <div className="history-mood">
                            <span className="history-emoji">{mood?.emoji || '😐'}</span>
                            <div className="history-details">
                              <span className="history-label">
                                {mood?.label || 'Unknown'} ({entry.moodValue}/10)
                              </span>
                              {entry.notes && (
                                <span className="history-notes">{entry.notes}</span>
                              )}
                              {isAutoGenerated && (
                                <span className="auto-badge">Auto-generated</span>
                              )}
                            </div>
                          </div>
                          <div className="history-time">
                            {new Date(entry.createdAt).toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!historyLoading && moodHistory.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" fill="var(--primary-green)" opacity="0.1" />
                    <path
                      d="M20 32c0-6.6 5.4-12 12-12s12 5.4 12 12-5.4 12-12 12-12-5.4-12-12z"
                      fill="var(--primary-green)"
                      opacity="0.3"
                    />
                    <path d="M26 28h4M34 28h4M24 38s4 4 8 4 8-4 8-4" stroke="var(--primary-green)" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <h3 className="empty-title">No mood entries yet</h3>
                <p className="empty-description">
                  Start tracking your mood to see insights and trends over time.
                </p>
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
      </div>
    </div>
  );
};

export default Mood;