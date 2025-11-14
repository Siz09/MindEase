'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Button } from '../components/shared';
import adminApi from '../adminApi';

export default function Settings() {
  const [crisisThreshold, setCrisisThreshold] = useState(5);
  const [emailNotifications, setEmailNotifications] = useState('all');
  const [autoArchive, setAutoArchive] = useState(true);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);
  const [dailyReportTime, setDailyReportTime] = useState('09:00');
  const [activeCategory, setActiveCategory] = useState('general');
  const [notification, setNotification] = useState(null);
  const categories = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const [isLoading, setIsLoading] = useState(false);

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // Load existing settings from the backend, if available
    const loadSettings = async () => {
      try {
        const { data } = await adminApi.get('/admin/settings');
        if (!isMountedRef.current || !data) return;
        if (typeof data.crisisThreshold === 'number') {
          setCrisisThreshold(data.crisisThreshold);
        }
        if (typeof data.emailNotifications === 'string') {
          setEmailNotifications(data.emailNotifications);
        }
        if (typeof data.autoArchive === 'boolean') {
          setAutoArchive(data.autoArchive);
        }
        if (typeof data.autoArchiveDays === 'number') {
          setAutoArchiveDays(data.autoArchiveDays);
        }
        if (typeof data.dailyReportTime === 'string') {
          setDailyReportTime(data.dailyReportTime);
        }
      } catch (err) {
        // If the endpoint is unavailable, fall back to component defaults
        console.error('Failed to load admin settings:', err?.message || err);
      }
    };

    loadSettings();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      await adminApi.post('/admin/settings', {
        crisisThreshold,
        emailNotifications,
        autoArchive,
        autoArchiveDays: autoArchive ? autoArchiveDays : null,
        dailyReportTime,
      });
      if (isMountedRef.current) {
        setNotification({ type: 'success', message: 'Settings saved successfully.' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error?.message || error);
      if (isMountedRef.current) {
        setNotification({ type: 'error', message: 'Unable to save settings.' });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleReset = () => {
    setCrisisThreshold(5);
    setEmailNotifications('all');
    setAutoArchive(true);
    setAutoArchiveDays(30);
    setDailyReportTime('09:00');
    setNotification({ type: 'info', message: 'Settings reset to defaults.' });
  };

  const renderGeneralSettings = () => (
    <Card
      className="bento-card"
      header={<div className="card-header-title">General Settings</div>}
    >
      <div
        style={{
          padding: 'var(--spacing-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-lg)',
        }}
      >
        {/* Crisis Alert Threshold */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--dark)',
            }}
          >
            Crisis Alert Threshold: {crisisThreshold}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <input
              type="range"
              min="1"
              max="10"
              value={crisisThreshold}
              onChange={(e) => setCrisisThreshold(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
              Sensitivity:{' '}
              {crisisThreshold > 7 ? 'High' : crisisThreshold > 4 ? 'Medium' : 'Low'}
            </span>
          </div>
        </div>

        {/* Auto-Archive Crisis Flags */}
        <div
          style={{
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--gray-light)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={autoArchive}
              onChange={(e) => setAutoArchive(e.target.checked)}
            />
            <span style={{ fontWeight: '500' }}>Auto-Archive Crisis Flags</span>
          </label>
          {autoArchive && (
            <div style={{ marginTop: 'var(--spacing-md)', marginLeft: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                After:{' '}
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={autoArchiveDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isNaN(val) && val >= 1 && val <= 365) {
                      setAutoArchiveDays(val);
                    }
                  }}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    border: '1px solid var(--gray-light)',
                    borderRadius: 'var(--radius-md)',
                    marginLeft: 'var(--spacing-sm)',
                  }}
                />{' '}
                days
              </label>
            </div>
          )}
        </div>

        {/* Email Notifications */}
        <div
          style={{
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--gray-light)',
          }}
        >
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--dark)',
            }}
          >
            Email Notifications
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="notifications"
                checked={emailNotifications === 'all'}
                onChange={() => setEmailNotifications('all')}
              />
              <span>All Events</span>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="notifications"
                checked={emailNotifications === 'critical'}
                onChange={() => setEmailNotifications('critical')}
              />
              <span>Critical Only</span>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="notifications"
                checked={emailNotifications === 'none'}
                onChange={() => setEmailNotifications('none')}
              />
              <span>None</span>
            </label>
          </div>
        </div>

        {/* Daily Report Time */}
        <div
          style={{
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--gray-light)',
          }}
        >
          <label
            style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--dark)',
            }}
          >
            Daily Report Time
          </label>
          <input
            type="time"
            value={dailyReportTime}
            onChange={(e) => setDailyReportTime(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--gray-light)',
          }}
        >
          <Button variant="primary" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            Reset to Default
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderPlaceholder = (title, description) => (
    <Card className="bento-card" header={<div className="card-header-title">{title}</div>}>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{description}</p>
      </div>
    </Card>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'security':
        return renderPlaceholder(
          'Security Settings',
          'Security controls and user permissions will appear here soon.'
        );
      case 'notifications':
        return renderPlaceholder(
          'Notification Preferences',
          'Customize notification channels and delivery windows in the future.'
        );
      case 'advanced':
        return renderPlaceholder(
          'Advanced Settings',
          'Advanced administrative controls will be available shortly.'
        );
      case 'general':
      default:
        return renderGeneralSettings();
    }
  };

  // Auto-dismiss success and info notifications after 5 seconds
  useEffect(() => {
    if (notification && notification.type !== 'error') {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure admin preferences and system behavior</p>
      </div>

      {notification && (
        <div
          style={{
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            backgroundColor:
              notification.type === 'error'
                ? 'var(--color-error-bg)'
                : notification.type === 'info'
                  ? 'var(--color-info-bg)'
                  : 'var(--color-success-bg)',
            color:
              notification.type === 'error'
                ? 'var(--color-danger)'
                : notification.type === 'info'
                  ? 'var(--color-primary)'
                  : 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)'
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0 8px',
              lineHeight: 1,
              color: 'inherit'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-xl)' }}>
        <nav aria-label="Settings categories" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  textAlign: 'left',
                  padding: 'var(--spacing-md)',
                  background: isActive ? 'var(--primary)' : 'none',
                  color: isActive ? 'white' : 'var(--gray)',
                  border: isActive ? 'none' : '1px solid var(--gray-light)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'var(--transition-fast)',
                }}
              >
                {category.label}
              </button>
            );
          })}
        </nav>

        <div>{renderContent()}</div>
      </div>
    </div>
  );
}
