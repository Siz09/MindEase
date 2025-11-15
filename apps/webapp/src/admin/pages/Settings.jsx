'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Button } from '../components/shared';
import adminApi from '../adminApi';
import '../../styles/admin-settings.css';

export default function Settings() {
  const [crisisThreshold, setCrisisThreshold] = useState(5);
  const [emailNotifications, setEmailNotifications] = useState('all');
  const [autoArchive, setAutoArchive] = useState(true);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);
  const [dailyReportTime, setDailyReportTime] = useState('09:00');
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const loadSettings = async () => {
      try {
        const { data } = await adminApi.get('/admin/settings');
        if (!isMountedRef.current || !data) return;
        if (typeof data.crisisThreshold === 'number') {
          const threshold = Math.max(1, Math.min(10, data.crisisThreshold));
          setCrisisThreshold(threshold);
        }
        if (typeof data.emailNotifications === 'string') {
          const validOptions = ['all', 'critical', 'none'];
          if (validOptions.includes(data.emailNotifications)) {
            setEmailNotifications(data.emailNotifications);
          }
        }
        if (typeof data.autoArchive === 'boolean') {
          setAutoArchive(data.autoArchive);
        }
        if (typeof data.autoArchiveDays === 'number') {
          const days = Math.max(1, Math.min(365, data.autoArchiveDays));
          setAutoArchiveDays(days);
        }
        if (typeof data.dailyReportTime === 'string') {
          if (/^([0-1]\d|2[0-3]):[0-5]\d$/.test(data.dailyReportTime)) {
            setDailyReportTime(data.dailyReportTime);
          }
        }
      } catch (err) {
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

  useEffect(() => {
    if (notification && notification.type !== 'error') {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <h1 className="admin-settings-title">Settings</h1>
          <p className="admin-settings-subtitle">
            Manage your admin preferences and system configuration
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`admin-settings-notification admin-settings-notification-${notification.type}`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
            className="admin-settings-notification-close"
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-settings-content">
        {/* Crisis Alert Settings */}
        <Card className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3 21 19H3z" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <circle cx="12" cy="17" r="1" />
              </svg>
            </div>
            <div>
              <h2 className="admin-settings-card-title">Crisis Alert Threshold</h2>
              <p className="admin-settings-card-description">
                Adjust the sensitivity level for crisis detection alerts
              </p>
            </div>
          </div>
          <div className="admin-settings-card-body">
            <div className="admin-settings-range-group">
              <div className="admin-settings-range-header">
                <label className="admin-settings-label">
                  Sensitivity Level: {crisisThreshold}/10
                </label>
                <span className="admin-settings-range-badge">
                  {crisisThreshold > 7 ? 'High' : crisisThreshold > 4 ? 'Medium' : 'Low'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={crisisThreshold}
                onChange={(e) => setCrisisThreshold(Number(e.target.value))}
                className="admin-settings-range"
              />
              <div className="admin-settings-range-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Auto-Archive Settings */}
        <Card className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="8" y1="4" x2="8" y2="22" />
                <line x1="16" y1="4" x2="16" y2="22" />
              </svg>
            </div>
            <div>
              <h2 className="admin-settings-card-title">Auto-Archive Crisis Flags</h2>
              <p className="admin-settings-card-description">
                Automatically archive crisis flags after a specified period
              </p>
            </div>
          </div>
          <div className="admin-settings-card-body">
            <div className="admin-settings-toggle-group">
              <div className="admin-settings-toggle">
                <label className="admin-settings-toggle-label">
                  <input
                    type="checkbox"
                    checked={autoArchive}
                    onChange={(e) => setAutoArchive(e.target.checked)}
                    className="admin-settings-toggle-input"
                  />
                  <span className="admin-settings-toggle-slider"></span>
                </label>
                <div className="admin-settings-toggle-content">
                  <span className="admin-settings-toggle-title">Enable Auto-Archive</span>
                  <span className="admin-settings-toggle-description">
                    Automatically archive old crisis flags to keep the system clean
                  </span>
                </div>
              </div>
              {autoArchive && (
                <div className="admin-settings-archive-days">
                  <label className="admin-settings-label">Archive after</label>
                  <div className="admin-settings-input-group">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={autoArchiveDays}
                      onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (Number.isNaN(val) || val < 1) {
                          setAutoArchiveDays(1);
                        } else if (val > 365) {
                          setAutoArchiveDays(365);
                        }
                      }}
                      className="admin-settings-input"
                    />
                    <span className="admin-settings-input-suffix">days</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Email Notifications */}
        <Card className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <h2 className="admin-settings-card-title">Email Notifications</h2>
              <p className="admin-settings-card-description">
                Choose which events trigger email notifications
              </p>
            </div>
          </div>
          <div className="admin-settings-card-body">
            <div className="admin-settings-radio-group">
              <label className="admin-settings-radio">
                <input
                  type="radio"
                  name="notifications"
                  value="all"
                  checked={emailNotifications === 'all'}
                  onChange={(e) => setEmailNotifications(e.target.value)}
                  className="admin-settings-radio-input"
                />
                <div className="admin-settings-radio-content">
                  <span className="admin-settings-radio-title">All Events</span>
                  <span className="admin-settings-radio-description">
                    Receive notifications for all system events
                  </span>
                </div>
              </label>
              <label className="admin-settings-radio">
                <input
                  type="radio"
                  name="notifications"
                  value="critical"
                  checked={emailNotifications === 'critical'}
                  onChange={(e) => setEmailNotifications(e.target.value)}
                  className="admin-settings-radio-input"
                />
                <div className="admin-settings-radio-content">
                  <span className="admin-settings-radio-title">Critical Only</span>
                  <span className="admin-settings-radio-description">
                    Only receive notifications for critical events
                  </span>
                </div>
              </label>
              <label className="admin-settings-radio">
                <input
                  type="radio"
                  name="notifications"
                  value="none"
                  checked={emailNotifications === 'none'}
                  onChange={(e) => setEmailNotifications(e.target.value)}
                  className="admin-settings-radio-input"
                />
                <div className="admin-settings-radio-content">
                  <span className="admin-settings-radio-title">None</span>
                  <span className="admin-settings-radio-description">
                    Disable all email notifications
                  </span>
                </div>
              </label>
            </div>
          </div>
        </Card>

        {/* Daily Report Time */}
        <Card className="admin-settings-card">
          <div className="admin-settings-card-header">
            <div className="admin-settings-card-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h2 className="admin-settings-card-title">Daily Report Time</h2>
              <p className="admin-settings-card-description">
                Set the time when daily reports are generated and sent
              </p>
            </div>
          </div>
          <div className="admin-settings-card-body">
            <div className="admin-settings-time-group">
              <label className="admin-settings-label">Report Time</label>
              <input
                type="time"
                value={dailyReportTime}
                onChange={(e) => setDailyReportTime(e.target.value)}
                className="admin-settings-time-input"
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="admin-settings-actions">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isLoading}
            className="admin-settings-save-btn"
          >
            {isLoading ? (
              <>
                <svg
                  className="admin-settings-spinner"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="32"
                    strokeDashoffset="32"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      dur="2s"
                      values="0 32;16 16;0 32;0 32"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-dashoffset"
                      dur="2s"
                      values="0;-16;-32;-32"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button variant="ghost" onClick={handleReset} className="admin-settings-reset-btn">
            Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
}
