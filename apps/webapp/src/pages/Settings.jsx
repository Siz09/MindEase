import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Settings.css';

export default function Settings() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize the toggle with the user's current anonymous mode setting
  useEffect(() => {
    if (user) {
      setAnonymousMode(user.anonymousMode || false);
    }
  }, [user]);

  const handleToggleAnonymousMode = async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/anonymous-mode`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ anonymousMode: !anonymousMode }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setAnonymousMode(updatedUser.anonymousMode);
        toast.success(
          updatedUser.anonymousMode ? 'Anonymous mode enabled' : 'Anonymous mode disabled'
        );
      } else {
        const error = await response.text();
        toast.error(`Failed to update settings: ${error}`);
      }
    } catch (error) {
      console.error('Error updating anonymous mode:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="settings-container">
        <div className="settings-card">
          <h2>Settings</h2>
          <p>Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2>{t('settings.title')}</h2>

        <div className="settings-section">
          <h3>{t('settings.privacy')}</h3>

          <div className="setting-item">
            <div className="setting-info">
              <h4>{t('settings.anonymousMode')}</h4>
              <p>{t('settings.anonymousModeDescription')}</p>
            </div>
            <div className="setting-action">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={anonymousMode}
                  onChange={handleToggleAnonymousMode}
                  disabled={loading}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t('settings.account')}</h3>
          <div className="setting-item">
            <div className="setting-info">
              <h4>{t('settings.email')}</h4>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>{t('settings.role')}</h4>
              <p>{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
