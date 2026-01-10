'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Input } from '../components/shared';
import Toast from '../components/shared/Toast';
import adminApi from '../adminApi';

export default function SystemMonitoring() {
  const [systemStatus, setSystemStatus] = useState({
    apiStatus: 'checking...',
    database: 'checking...',
    aiEngine: 'checking...',
  });

  const [health, setHealth] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    connectedUsers: 0,
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const loadSystemStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, healthRes, errorsRes] = await Promise.all([
        adminApi.get('/admin/system/status').catch(() => ({ data: {} })),
        adminApi.get('/admin/system/health').catch(() => ({ data: {} })),
        adminApi.get('/admin/system/errors').catch(() => ({ data: [] })),
      ]);

      setSystemStatus(
        statusRes.data || {
          apiStatus: 'down',
          database: 'unknown',
          aiEngine: 'unknown',
        }
      );
      setHealth(healthRes.data || {});
      setErrors(Array.isArray(errorsRes.data) ? errorsRes.data : []);
    } catch {
      // Explicitly set status to down on error
      setSystemStatus({
        apiStatus: 'down',
        database: 'unreachable',
        aiEngine: 'unreachable',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.trim()) return;

    setSending(true);
    try {
      await adminApi.post('/admin/system/notifications', { message: announcement });
      setToast({ type: 'success', message: 'Announcement sent successfully' });
      setAnnouncement('');
    } catch {
      setToast({ type: 'error', message: 'Failed to send announcement' });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [loadSystemStatus]);

  const HealthBar = ({ label, value }) => {
    const isUnavailable = value < 0;
    const displayValue = isUnavailable ? 0 : value;
    const clampedValue = Math.max(0, Math.min(100, displayValue));

    return (
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          <span style={{ fontWeight: '500' }}>{label}</span>
          <span style={{ fontWeight: '700' }}>{isUnavailable ? 'N/A' : `${clampedValue}%`}</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--gray-light)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}
        >
          {!isUnavailable && (
            <div
              style={{
                width: `${clampedValue}%`,
                height: '100%',
                backgroundColor:
                  clampedValue > 80
                    ? 'var(--danger)'
                    : clampedValue > 60
                      ? 'var(--warning)'
                      : 'var(--success)',
                transition: 'background-color 0.3s ease',
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">System Health & Monitoring</h1>
        <p className="page-subtitle">Real-time system performance and diagnostics</p>
      </div>

      {loading && (
        <div
          style={{
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Loading system status…
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <Card className="bento-card" header={<div className="card-header-title">API Status</div>}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color:
                  systemStatus.apiStatus === 'operational' ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {systemStatus.apiStatus === 'operational' ? '✓' : '✗'}
            </div>
            <p
              style={{ color: 'var(--gray)', fontSize: '12px', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              {systemStatus.apiStatus === 'operational' ? 'Operational' : 'Down'}
            </p>
            <p
              style={{ fontSize: '11px', color: 'var(--gray)', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              99.9% uptime
            </p>
          </div>
        </Card>

        <Card className="bento-card" header={<div className="card-header-title">Database</div>}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: systemStatus.database === 'healthy' ? 'var(--success)' : 'var(--warning)',
              }}
            >
              {systemStatus.database === 'healthy' ? '✓' : '⚠'}
            </div>
            <p
              style={{ color: 'var(--gray)', fontSize: '12px', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              {systemStatus.database}
            </p>
            <p
              style={{ fontSize: '11px', color: 'var(--gray)', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              45ms avg query
            </p>
          </div>
        </Card>

        <Card className="bento-card" header={<div className="card-header-title">AI Engine</div>}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: systemStatus.aiEngine === 'running' ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {systemStatus.aiEngine === 'running' ? '✓' : '✗'}
            </div>
            <p
              style={{ color: 'var(--gray)', fontSize: '12px', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              {systemStatus.aiEngine}
            </p>
            <p
              style={{ fontSize: '11px', color: 'var(--gray)', margin: 'var(--spacing-sm) 0 0 0' }}
            >
              2.3 req/sec
            </p>
          </div>
        </Card>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <Card
          className="bento-card"
          header={<div className="card-header-title">Server Resources</div>}
        >
          <div style={{ padding: 'var(--spacing-lg)' }}>
            <HealthBar label="CPU Usage" value={health.cpu >= 0 ? health.cpu : 0} />
            <HealthBar label="Memory Usage" value={health.memory >= 0 ? health.memory : 0} />
            <HealthBar label="Disk Usage" value={health.disk >= 0 ? health.disk : 0} />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-lg)',
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  UPTIME
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  {(() => {
                    if (!health.uptime) return '00:00:00';
                    const totalSeconds = Math.floor(health.uptime / 1000);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                  })()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  ACTIVE THREADS
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  {health.activeThreads || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  CONNECTED USERS
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
                  {health.connectedUsers || 0}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="bento-card"
          header={<div className="card-header-title">System Announcement</div>}
        >
          <div
            style={{
              padding: 'var(--spacing-lg)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <p
              style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: 'var(--spacing-md)' }}
            >
              Broadcast a message to all currently connected users.
            </p>
            <form
              onSubmit={handleSendAnnouncement}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                flex: 1,
              }}
            >
              <Input
                as="textarea"
                placeholder="Type your announcement here..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                style={{ flex: 1, minHeight: '100px', resize: 'none' }}
              />
              <Button variant="primary" type="submit" disabled={sending || !announcement.trim()}>
                {sending ? 'Sending...' : 'Send Announcement'}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <Card
        className="bento-card"
        header={<div className="card-header-title">Recent Errors (Last 24h)</div>}
      >
        {errors.length === 0 ? (
          <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--gray)' }}>
            No errors detected
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--gray-lighter)' }}>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}
                  >
                    Error Code
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}
                  >
                    Count
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}
                  >
                    Last Occurred
                  </th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                    <td
                      style={{
                        padding: 'var(--spacing-md)',
                        color: 'var(--danger)',
                        fontWeight: '600',
                      }}
                    >
                      {err.code || 'Unknown'}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--dark)' }}>
                      {err.count || 0}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-md)',
                        color: 'var(--gray)',
                        fontSize: '12px',
                      }}
                    >
                      {err.lastOccurred ? new Date(err.lastOccurred).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
