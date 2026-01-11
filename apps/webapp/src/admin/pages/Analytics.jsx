'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, ChartCard, Button, Select } from '../components/shared';
import adminApi from '../adminApi';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [metrics, setMetrics] = useState({
    dau: 0,
    mau: 0,
    retention: 0,
    churn: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.get(`/admin/analytics/overview?range=${dateRange}`);
      setMetrics(data || { dau: 0, mau: 0, retention: 0, churn: 0 });
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Failed to load analytics';
      setError(errorMessage);
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'usage', label: 'Usage' },
    { id: 'crisis', label: 'Crisis Trends' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics & Insights</h1>
        <p className="page-subtitle">Deep-dive analytics and usage patterns</p>
        <div className="page-actions">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
              { value: '1y', label: 'Last Year' },
            ]}
            style={{ width: '150px' }}
          />
          <Button variant="secondary">Export Report</Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Error:</strong> {error}
          </div>
          <Button variant="ghost" onClick={loadAnalytics} size="sm">
            Retry
          </Button>
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--gray)',
            fontSize: '14px',
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>Loading analytics...</div>
        </div>
      )}

      <div
        className="bento-card"
        style={{
          marginBottom: 'var(--spacing-lg)',
          display: 'flex',
          padding: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--gray-light)',
            gap: 'var(--spacing-lg)',
            width: '100%',
            padding: '0 var(--spacing-lg)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--spacing-md) 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : 'none',
                transition: 'var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            <Card className="bento-card" header={<div className="card-header-title">DAU</div>}>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary)' }}>
                  {(metrics.dau || 0).toLocaleString()}
                </div>
                <p
                  style={{
                    color: 'var(--gray)',
                    fontSize: '12px',
                    margin: 'var(--spacing-sm) 0 0 0',
                  }}
                >
                  Daily Active Users
                </p>
              </div>
            </Card>

            <Card className="bento-card" header={<div className="card-header-title">MAU</div>}>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--accent)' }}>
                  {(metrics.mau || 0).toLocaleString()}
                </div>
                <p
                  style={{
                    color: 'var(--gray)',
                    fontSize: '12px',
                    margin: 'var(--spacing-sm) 0 0 0',
                  }}
                >
                  Monthly Active Users
                </p>
              </div>
            </Card>

            <Card
              className="bento-card"
              header={<div className="card-header-title">Retention</div>}
            >
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success)' }}>
                  {(metrics.retention || 0).toFixed(1)}%
                </div>
                <p
                  style={{
                    color: 'var(--gray)',
                    fontSize: '12px',
                    margin: 'var(--spacing-sm) 0 0 0',
                  }}
                >
                  Month-over-Month
                </p>
              </div>
            </Card>

            <Card className="bento-card" header={<div className="card-header-title">Churn</div>}>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--warning)' }}>
                  {(metrics.churn || 0).toFixed(1)}%
                </div>
                <p
                  style={{
                    color: 'var(--gray)',
                    fontSize: '12px',
                    margin: 'var(--spacing-sm) 0 0 0',
                  }}
                >
                  Monthly Churn Rate
                </p>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <ChartCard title="User Growth" subtitle="Last 6 months">
              <div style={{ color: 'var(--gray)' }}>[User Growth Chart]</div>
            </ChartCard>

            <ChartCard title="Feature Usage" subtitle="Platform engagement">
              <div style={{ color: 'var(--gray)' }}>[Feature Usage Chart]</div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <Card
            className="bento-card"
            header={<div className="card-header-title">User Segments</div>}
          >
            <div style={{ padding: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 'var(--spacing-lg)',
                    borderBottom: '1px solid var(--gray-light)',
                  }}
                >
                  <span>Premium Subscribers</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>1,234</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 'var(--spacing-lg)',
                    borderBottom: '1px solid var(--gray-light)',
                  }}
                >
                  <span>Free Users</span>
                  <span style={{ fontWeight: '700', color: 'var(--dark)' }}>5,678</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 'var(--spacing-lg)',
                  }}
                >
                  <span>Inactive (30+ days)</span>
                  <span style={{ fontWeight: '700', color: 'var(--gray)' }}>2,345</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div>
          <ChartCard title="API Usage" subtitle="Daily requests" className="bento-card">
            <div style={{ color: 'var(--gray)' }}>[API Usage Chart]</div>
          </ChartCard>
        </div>
      )}

      {/* Crisis Trends Tab */}
      {activeTab === 'crisis' && (
        <div>
          <ChartCard
            title="Crisis Flags Over Time"
            subtitle="Historical trends"
            className="bento-card"
          >
            <div style={{ color: 'var(--gray)' }}>[Crisis Trends Chart]</div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
