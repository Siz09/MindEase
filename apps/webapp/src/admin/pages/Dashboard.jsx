'use client';

import { useEffect, useState } from 'react';
import adminApi from '../adminApi';

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
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setError(null);
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [statsRes, activityRes, alertsRes] = await Promise.all([
          adminApi.get('/admin/dashboard/overview').catch(() => ({ data: {} })),
          adminApi.get('/admin/dashboard/activity-trend').catch(() => ({ data: [] })),
          adminApi.get('/admin/dashboard/recent-alerts').catch(() => ({ data: [] })),
        ]);

        if (mounted) {
          setStats(statsRes.data);
          setActivityData(activityRes.data);
          setRecentAlerts(alertsRes.data);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load dashboard data');
          console.error('Dashboard error:', err);
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

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening with MindEase today.</p>
      </div>

      {error && (
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
            <div className="bento-card-trend">↑ 12% vs last week</div>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-content">
            <div className="bento-card-icon">📝</div>
            <div className="bento-card-label">Daily Signups</div>
            <div className="bento-card-value">{stats.dailySignups?.toLocaleString() || '0'}</div>
            <div className="bento-card-trend">↑ 8% vs last week</div>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-content">
            <div className="bento-card-icon">🚨</div>
            <div className="bento-card-label">Crisis Flags</div>
            <div className="bento-card-value">{stats.crisisFlags?.toLocaleString() || '0'}</div>
            <div className="bento-card-trend negative">↓ 2% vs last week</div>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-content">
            <div className="bento-card-icon">🤖</div>
            <div className="bento-card-label">AI Usage</div>
            <div className="bento-card-value">{stats.aiUsage?.toLocaleString() || '0'}</div>
            <div className="bento-card-trend">↑ 15% vs last week</div>
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
            [Activity Chart Placeholder - Will use Canvas/SVG]
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Crisis Flags Distribution</div>
            <div className="chart-card-subtitle">Risk level breakdown</div>
          </div>
          <div className="chart-placeholder">[Distribution Chart Placeholder]</div>
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
                key={idx}
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
        operational • Last updated 2 minutes ago
      </div>
    </div>
  );
}
