'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import adminApi from '../adminApi';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Tooltip,
  Legend
);

const fmt = (d) => new Date(d).toLocaleDateString();

function normalizeOverview(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    activeUsers: Number(data.activeUsers ?? data.active_users ?? 0) || 0,
    dailySignups: Number(data.dailySignups ?? data.signupsToday ?? data.signups_today ?? 0) || 0,
    crisisFlags: Number(data.crisisFlags ?? data.crisisLast24h ?? data.crisis_last_24h ?? 0) || 0,
    aiUsage: Number(data.aiUsage ?? data.aiCallsLast24h ?? data.ai_calls_last_24h ?? 0) || 0,
    activeUsersTrend: data.activeUsersTrend ?? data.active_users_trend ?? null,
    dailySignupsTrend: data.dailySignupsTrend ?? data.signupsTrend ?? data.signups_trend ?? null,
    crisisFlagsTrend: data.crisisFlagsTrend ?? data.crisisTrend ?? data.crisis_trend ?? null,
    aiUsageTrend: data.aiUsageTrend ?? data.ai_usage_trend ?? null,
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    dailySignups: 0,
    crisisFlags: 0,
    aiUsage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [crisisStats, setCrisisStats] = useState({ high: 0, medium: 0, low: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const activityChartRef = useRef(null);
  const crisisChartRef = useRef(null);
  const charts = useRef({ activity: null, crisis: null });
  const isCanvasLive = (canvas) => !!(canvas && canvas.ownerDocument && canvas.isConnected);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setError(null);
        setLoading(true);

        // Fetch all dashboard data in parallel, allowing partial failures
        const [statsRes, activityRes, alertsRes, crisisStatsRes] = await Promise.allSettled([
          adminApi.get('/admin/dashboard/overview'),
          adminApi.get('/admin/dashboard/activity-trend'),
          adminApi.get('/admin/dashboard/recent-alerts'),
          adminApi.get('/admin/crisis-flags/stats?timeRange=24h'),
        ]);

        if (mounted) {
          const failures = [];
          if (statsRes.status === 'rejected') failures.push('overview stats');
          if (activityRes.status === 'rejected') failures.push('activity data');
          if (alertsRes.status === 'rejected') failures.push('recent alerts');
          if (crisisStatsRes.status === 'rejected') failures.push('crisis stats');

          if (failures.length > 0) {
            setError(`Failed to load: ${failures.join(', ')}`);
          }

          if (statsRes.status === 'fulfilled') {
            setStats(normalizeOverview(statsRes.value.data));
          }

          const activityPayload =
            activityRes.status === 'fulfilled' && Array.isArray(activityRes.value.data)
              ? activityRes.value.data
              : [];
          const alertsPayload =
            alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value.data)
              ? alertsRes.value.data
              : [];

          setActivityData(activityPayload);
          if (crisisStatsRes.status === 'fulfilled') {
            const raw = crisisStatsRes.value?.data || {};
            // Normalize to a simple POJO with numeric fields; defensive against undefined/null
            setCrisisStats({
              high: Number(raw.high) || 0,
              medium: Number(raw.medium) || 0,
              low: Number(raw.low) || 0,
            });
          } else {
            setCrisisStats({ high: 0, medium: 0, low: 0 });
          }
          setRecentAlerts(alertsPayload);
          setLastUpdated(new Date());
          // API failures handled gracefully
        }
      } catch {
        if (mounted) {
          setError('Failed to load dashboard data');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Clean up charts on unmount
    return () => {
      Object.values(charts.current).forEach((c) => c?.destroy?.());
    };
  }, []);

  useEffect(() => {
    if (error) return;

    // User Activity chart (line)
    if (activityChartRef.current) {
      const canvas = activityChartRef.current;
      const labels = (activityData || []).map((pt) => fmt(pt.day));
      const values = (activityData || []).map(
        (pt) => pt.activeUsers ?? pt.active_users ?? pt.count ?? 0
      );

      if (!charts.current.activity && isCanvasLive(canvas) && activityData.length > 0) {
        try {
          charts.current.activity = new Chart(canvas, {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: 'Daily Active Users',
                  data: values,
                  borderColor: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true } },
            },
          });
        } catch (err) {
          console.error('Failed to create activity chart:', err);
        }
      } else if (
        charts.current.activity &&
        charts.current.activity.canvas &&
        isCanvasLive(charts.current.activity.canvas)
      ) {
        charts.current.activity.data.labels = labels;
        charts.current.activity.data.datasets[0].data = values;
        try {
          charts.current.activity.update();
        } catch {
          // ignore update errors
        }
      }
    }

    // Crisis Flags Distribution chart (bar)
    if (crisisChartRef.current) {
      const canvas = crisisChartRef.current;
      const labels = ['High', 'Medium', 'Low'];
      const values = [crisisStats?.high || 0, crisisStats?.medium || 0, crisisStats?.low || 0];

      if (!charts.current.crisis && isCanvasLive(canvas)) {
        try {
          charts.current.crisis = new Chart(canvas, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                {
                  label: 'Crisis Flags',
                  data: values,
                  backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true } },
            },
          });
        } catch {
          // Failed to create crisis chart
        }
      } else if (
        charts.current.crisis &&
        charts.current.crisis.canvas &&
        isCanvasLive(charts.current.crisis.canvas)
      ) {
        charts.current.crisis.data.labels = labels;
        charts.current.crisis.data.datasets[0].data = values;
        try {
          charts.current.crisis.update();
        } catch {
          // ignore update errors
        }
      }
    }
  }, [activityData, crisisStats, error]);

  const formatTrendText = (trendValue) => {
    if (trendValue == null) return 'No trend data';
    if (typeof trendValue === 'string' && trendValue.trim().length) return trendValue;
    if (typeof trendValue === 'number' && !Number.isNaN(trendValue)) {
      if (trendValue === 0) return '→ 0.0% vs last week';
      return `${trendValue > 0 ? '↑' : '↓'} ${Math.abs(trendValue).toFixed(1)}% vs last week`;
    }
    return 'No trend data';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening with MindEase today.</p>
      </div>

      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem',
            }}
          />
          <div>Loading dashboard data...</div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-lg)',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </div>
      )}

      <div className="bento-grid">
        <div className="bento-card">
          <div className="bento-card-content">
            <div className="bento-card-icon">👥</div>
            <div className="bento-card-label">Active Users</div>
            <div className="bento-card-value">{stats.activeUsers?.toLocaleString() || '0'}</div>
            <div className="bento-card-trend">{formatTrendText(stats.activeUsersTrend)}</div>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-content">
            <div className="bento-card-icon">📝</div>
            <div className="bento-card-label">Daily Signups</div>
            <div className="bento-card-value">{stats.dailySignups?.toLocaleString() || '0'}</div>
            <div className="bento-card-trend">{formatTrendText(stats.dailySignupsTrend)}</div>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-content">
            <div className="bento-card-icon">🚨</div>
            <div className="bento-card-label">Crisis Flags</div>
            <div className="bento-card-value">{stats.crisisFlags?.toLocaleString() || '0'}</div>
            <div className="bento-card-trend negative">
              {formatTrendText(stats.crisisFlagsTrend)}
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-content">
            <div className="bento-card-icon">🤖</div>
            <div className="bento-card-label">AI Usage</div>
            <div className="bento-card-value">{stats.aiUsage?.toLocaleString() || '0'}</div>
            <div className="bento-card-trend">{formatTrendText(stats.aiUsageTrend)}</div>
          </div>
        </div>
      </div>

      <div className="bento-grid-2" style={{ marginTop: 'var(--spacing-xl)' }}>
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">User Activity (Last 30 Days)</div>
            <div className="chart-card-subtitle">Daily active users trend</div>
          </div>
          <div className="chart-placeholder">
            <canvas ref={activityChartRef} style={{ width: '100%', height: '260px' }} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Crisis Flags Distribution</div>
            <div className="chart-card-subtitle">Risk level breakdown</div>
          </div>
          <div className="chart-placeholder">
            <canvas ref={crisisChartRef} style={{ width: '100%', height: '260px' }} />
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 'var(--spacing-xl)' }}>
        <div className="chart-card-header">
          <div className="chart-card-title">Recent Alerts & Events</div>
          <div className="chart-card-subtitle">Latest system notifications</div>
        </div>
        {loading ? (
          <p
            style={{
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
            }}
          >
            Loading alerts...
          </p>
        ) : recentAlerts.length === 0 ? (
          <p
            style={{
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
            }}
          >
            No recent alerts
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {recentAlerts.slice(0, 5).map((alert, idx) => (
              <div
                key={
                  alert.id ||
                  alert.createdAt ||
                  alert.timestamp ||
                  `${alert.userId || 'alert'}-${idx}`
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid var(--color-warning)',
                }}
              >
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      margin: '0 0 4px 0',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {alert.title || 'Alert'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {alert.message || 'System alert'}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Recently'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Status Footer */}
      <div
        style={{
          marginTop: 'var(--spacing-2xl)',
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '12px',
        }}
      >
        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓</span> All systems
        operational{lastUpdated && ` • Last updated ${lastUpdated.toLocaleTimeString()}`}
      </div>
    </div>
  );
}
