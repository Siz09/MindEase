import { Card } from '../shared';

const EmailNotificationsCard = ({ emailNotifications, onChange }) => {
  return (
    <Card className="admin-settings-card">
      <div className="admin-settings-card-header">
        <div className="admin-settings-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              onChange={(e) => onChange(e.target.value)}
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
              onChange={(e) => onChange(e.target.value)}
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
              onChange={(e) => onChange(e.target.value)}
              className="admin-settings-radio-input"
            />
            <div className="admin-settings-radio-content">
              <span className="admin-settings-radio-title">None</span>
              <span className="admin-settings-radio-description">Disable all email notifications</span>
            </div>
          </label>
        </div>
      </div>
    </Card>
  );
};

export default EmailNotificationsCard;

