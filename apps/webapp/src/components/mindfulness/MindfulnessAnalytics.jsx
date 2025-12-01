import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import '../../styles/mindfulness/MindfulnessAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const MindfulnessAnalytics = ({ days = 30 }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(days);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/mindfulness/analytics?days=${selectedPeriod}`);
      if (response.data.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMinutes = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSessionChartData = () => {
    if (!analytics?.recentActivities || analytics.recentActivities.length === 0) {
      return null;
    }

    // Group by date
    const activitiesByDate = {};
    analytics.recentActivities.forEach((activity) => {
      const date = new Date(activity.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!activitiesByDate[date]) {
        activitiesByDate[date] = 0;
      }
      activitiesByDate[date]++;
    });

    const dates = Object.keys(activitiesByDate).reverse();
    const counts = dates.map((date) => activitiesByDate[date]);

    return {
      labels: dates,
      datasets: [
        {
          label: t('mindfulness.analytics.sessionsPerDay', 'Sessions per Day'),
          data: counts,
          borderColor: 'rgb(102, 126, 234)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const getCategoryDistribution = () => {
    if (!analytics?.recentActivities || analytics.recentActivities.length === 0) {
      return null;
    }

    const categoryCount = {};
    analytics.recentActivities.forEach((activity) => {
      const category = activity.session?.category || 'Unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const categories = Object.keys(categoryCount);
    const counts = Object.values(categoryCount);

    return {
      labels: categories,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(59, 130, 246, 0.8)',
          ],
        },
      ],
    };
  };

  const getMoodCorrelationData = () => {
    if (!analytics?.recentActivities || analytics.recentActivities.length === 0) {
      return null;
    }

    const activitiesWithMood = analytics.recentActivities.filter(
      (a) => a.moodBefore !== null && a.moodAfter !== null
    );

    if (activitiesWithMood.length === 0) {
      return null;
    }

    const moodChanges = activitiesWithMood.map((activity) => ({
      date: new Date(activity.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      before: activity.moodBefore,
      after: activity.moodAfter,
      change: activity.moodAfter - activity.moodBefore,
    }));

    return {
      labels: moodChanges.map((m) => m.date),
      datasets: [
        {
          label: t('mindfulness.analytics.moodBefore', 'Mood Before'),
          data: moodChanges.map((m) => m.before),
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
        },
        {
          label: t('mindfulness.analytics.moodAfter', 'Mood After'),
          data: moodChanges.map((m) => m.after),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        {
          label: t('mindfulness.analytics.moodChange', 'Change'),
          data: moodChanges.map((m) => m.change),
          borderColor: 'rgb(102, 126, 234)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          type: 'bar',
        },
      ],
    };
  };

  if (isLoading) {
    return (
      <div className="mindfulness-analytics-loading">
        <div className="spinner"></div>
        <p>{t('mindfulness.analytics.loading', 'Loading analytics...')}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="mindfulness-analytics-empty">
        <p>{t('mindfulness.analytics.noData', 'No analytics data available yet.')}</p>
      </div>
    );
  }

  const sessionChartData = getSessionChartData();
  const categoryData = getCategoryDistribution();
  const moodData = getMoodCorrelationData();

  return (
    <div className="mindfulness-analytics">
      <div className="analytics-header">
        <h2>{t('mindfulness.analytics.title', 'Your Mindfulness Journey')}</h2>
        <div className="period-selector">
          {[7, 30, 90, 365].map((period) => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}d
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{formatMinutes(analytics.totalMinutes)}</div>
          <div className="stat-label">
            {t('mindfulness.analytics.totalMinutes', 'Total Minutes')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics.totalSessions || 0}</div>
          <div className="stat-label">
            {t('mindfulness.analytics.totalSessions', 'Total Sessions')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics.streak?.currentStreak || 0}</div>
          <div className="stat-label">{t('mindfulness.analytics.currentStreak', 'Day Streak')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {analytics.averageMinutesPerSession
              ? Math.round(analytics.averageMinutesPerSession)
              : 0}
          </div>
          <div className="stat-label">
            {t('mindfulness.analytics.avgPerSession', 'Avg per Session')}
          </div>
        </div>
      </div>

      {sessionChartData && (
        <div className="chart-card">
          <h3>{t('mindfulness.analytics.sessionsOverTime', 'Sessions Over Time')}</h3>
          <Line
            data={sessionChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
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
            }}
          />
        </div>
      )}

      <div className="charts-row">
        {categoryData && (
          <div className="chart-card">
            <h3>{t('mindfulness.analytics.categoryDistribution', 'Category Distribution')}</h3>
            <Pie
              data={categoryData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        )}

        {moodData && (
          <div className="chart-card">
            <h3>{t('mindfulness.analytics.moodCorrelation', 'Mood Impact')}</h3>
            <Line
              data={moodData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    min: 1,
                    max: 10,
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MindfulnessAnalytics;
