import { Card } from '../shared';

const CrisisThresholdCard = ({ crisisThreshold, onChange }) => {
  return (
    <Card className="admin-settings-card">
      <div className="admin-settings-card-header">
        <div className="admin-settings-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <label className="admin-settings-label">Sensitivity Level: {crisisThreshold}/10</label>
            <span className="admin-settings-range-badge">
              {crisisThreshold > 7 ? 'High' : crisisThreshold > 4 ? 'Medium' : 'Low'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={crisisThreshold}
            onChange={(e) => onChange(Number(e.target.value))}
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
  );
};

export default CrisisThresholdCard;

