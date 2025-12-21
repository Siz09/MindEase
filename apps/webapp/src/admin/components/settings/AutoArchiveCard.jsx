import { Card } from '../shared';

const AutoArchiveCard = ({ autoArchive, autoArchiveDays, onToggle, onDaysChange, onDaysBlur }) => {
  return (
    <Card className="admin-settings-card">
      <div className="admin-settings-card-header">
        <div className="admin-settings-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                onChange={(e) => onToggle(e.target.checked)}
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
                  onChange={(e) => onDaysChange(Number(e.target.value))}
                  onBlur={onDaysBlur}
                  className="admin-settings-input"
                />
                <span className="admin-settings-input-suffix">days</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AutoArchiveCard;

