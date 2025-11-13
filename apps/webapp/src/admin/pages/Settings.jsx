'use client';

import { useState } from 'react';
import { Card, Button } from '../components/shared';

export default function Settings() {
  const [crisisThreshold, setCrisisThreshold] = useState(5);
  const [emailNotifications, setEmailNotifications] = useState('all');
  const [autoArchive, setAutoArchive] = useState(true);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);
  const [dailyReportTime, setDailyReportTime] = useState('09:00');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure admin preferences and system behavior</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Settings Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <button
            style={{
              textAlign: 'left',
              padding: 'var(--spacing-md)',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'var(--transition-fast)',
            }}
          >
            General
          </button>
          <button
            style={{
              textAlign: 'left',
              padding: 'var(--spacing-md)',
              background: 'none',
              color: 'var(--gray)',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'var(--transition-fast)',
            }}
          >
            Security
          </button>
          <button
            style={{
              textAlign: 'left',
              padding: 'var(--spacing-md)',
              background: 'none',
              color: 'var(--gray)',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'var(--transition-fast)',
            }}
          >
            Notifications
          </button>
          <button
            style={{
              textAlign: 'left',
              padding: 'var(--spacing-md)',
              background: 'none',
              color: 'var(--gray)',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'var(--transition-fast)',
            }}
          >
            Advanced
          </button>
        </div>

        {/* Settings Content */}
        <div>
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
                        onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
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
                <Button variant="primary">Save Changes</Button>
                <Button variant="ghost">Reset to Default</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
