import { Button } from '../shared';

const AdminSettingsActions = ({ onSave, onReset, isLoading }) => {
  return (
    <div className="admin-settings-actions">
      <Button
        variant="primary"
        onClick={onSave}
        disabled={isLoading}
        className="admin-settings-save-btn"
      >
        {isLoading ? (
          <>
            <svg className="admin-settings-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
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
      <Button variant="ghost" onClick={onReset} className="admin-settings-reset-btn">
        Reset to Default
      </Button>
    </div>
  );
};

export default AdminSettingsActions;

