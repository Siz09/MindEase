import { Card } from '../shared';

const DailyReportTimeCard = ({ dailyReportTime, onChange }) => {
  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e.target.value);
    }
  };

  return (
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
          <label htmlFor="daily-report-time" className="admin-settings-label">
            Report Time
          </label>
          <input
            id="daily-report-time"
            type="time"
            value={dailyReportTime ?? ''}
            onChange={handleChange}
            className="admin-settings-time-input"
          />
        </div>
      </div>
    </Card>
  );
};

export default DailyReportTimeCard;
