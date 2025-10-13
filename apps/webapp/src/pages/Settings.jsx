'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { patchQuietHours } from '../utils/api';
import { toast } from 'react-toastify';
import '../styles/Settings.css';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, updateUser, logout } = useAuth();
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [quietHoursLoading, setQuietHoursLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setAnonymousMode(currentUser.anonymousMode || false);
      // Load quiet hours from user data
      if (currentUser.quietHoursStart) {
        setQuietStart(currentUser.quietHoursStart.slice(0, 5)); // Extract HH:MM from HH:MM:SS
      }
      if (currentUser.quietHoursEnd) {
        setQuietEnd(currentUser.quietHoursEnd.slice(0, 5)); // Extract HH:MM from HH:MM:SS
      }
    }
    setCurrentLanguage(i18n.language || 'en');
  }, [currentUser, i18n.language]);

  const handleToggleAnonymousMode = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await updateUser({ anonymousMode: !anonymousMode });

      if (result.success) {
        setAnonymousMode(!anonymousMode);
        toast.success(
          anonymousMode
            ? t('settings.notifications.anonymousModeDisabled')
            : t('settings.notifications.anonymousModeEnabled')
        );
      } else {
        toast.error(t('settings.notifications.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating anonymous mode:', error);
      toast.error(t('settings.notifications.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
    toast.success(t('settings.notifications.languageChanged'));
  };

  const handleLogout = () => {
    logout();
  };

  const handleSaveQuietHours = async () => {
    if (!currentUser) return;

    // Guard against empty time values
    if (!quietStart || !quietEnd) {
      toast.error(t('settings.notifications.quietHours.emptyTimeError'));
      return;
    }

    // Validation: For midnight-spanning ranges, end time can be before start time
    // Only reject if both times are identical
    if (quietEnd === quietStart) {
      toast.error(t('settings.notifications.quietHours.validationError'));
      return;
    }

    try {
      setQuietHoursLoading(true);
      // Format times with seconds for backend consistency
      const startTimeWithSeconds = `${quietStart}:00`;
      const endTimeWithSeconds = `${quietEnd}:00`;

      await patchQuietHours({
        quietHoursStart: startTimeWithSeconds,
        quietHoursEnd: endTimeWithSeconds,
      });
      toast.success(t('settings.notifications.quietHours.success'));
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
      toast.error(t('settings.notifications.quietHours.error'));
    } finally {
      setQuietHoursLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="page settings-page">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">{t('settings.title')}</h1>
            <p className="page-subtitle">Please log in to access settings</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page settings-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>

        <div className="settings-content">
          {/* Account Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t('settings.account.title')}</h2>
            </div>

            <div className="account-info">
              <div className="info-item">
                <span className="info-label">{t('settings.account.email')}:</span>
                <span className="info-value">{currentUser.email || 'Anonymous User'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('settings.account.accountType')}:</span>
                <span className="info-value">
                  {currentUser.anonymousMode
                    ? t('settings.account.anonymous')
                    : t('settings.account.registered')}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('settings.account.role')}:</span>
                <span className="info-value">{currentUser.role || 'USER'}</span>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t('settings.privacy.title')}</h2>
            </div>

            <div className="form-group">
              <label className="form-label toggle-label">
                <div className="toggle-info">
                  <span className="toggle-title">{t('settings.privacy.anonymousMode')}</span>
                  <p className="setting-description">
                    {t('settings.privacy.anonymousModeDescription')}
                  </p>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={anonymousMode}
                    onChange={handleToggleAnonymousMode}
                    disabled={loading}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div className="privacy-info">
              <h4>{t('settings.privacy.dataRetention')}</h4>
              <p className="setting-description">
                {t('settings.privacy.dataRetentionDescription')}
              </p>
            </div>
          </div>

          {/* Language Settings */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t('settings.language.title')}</h2>
            </div>

            <div className="language-settings">
              <div className="current-language">
                <span className="info-label">{t('settings.language.currentLanguage')}:</span>
                <span className="info-value">
                  {currentLanguage === 'en'
                    ? t('settings.language.english')
                    : t('settings.language.nepali')}
                </span>
              </div>

              <div className="language-options">
                <button
                  className={`language-option ${currentLanguage === 'en' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                  disabled={currentLanguage === 'en'}
                >
                  <span className="language-flag">🇺🇸</span>
                  <span className="language-name">{t('settings.language.english')}</span>
                  {currentLanguage === 'en' && <span className="current-indicator">✓</span>}
                </button>

                <button
                  className={`language-option ${currentLanguage === 'ne' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('ne')}
                  disabled={currentLanguage === 'ne'}
                >
                  <span className="language-flag">🇳🇵</span>
                  <span className="language-name">{t('settings.language.nepali')}</span>
                  {currentLanguage === 'ne' && <span className="current-indicator">✓</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Hours Settings */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t('settings.notifications.quietHours.title')}</h2>
            </div>

            <div className="form-group">
              <p className="setting-description">
                {t('settings.notifications.quietHours.description')}
              </p>
            </div>

            <div className="quiet-hours-settings">
              <div className="quiet-hours-current">
                <h4>{t('settings.notifications.quietHours.currentSettings')}</h4>
                <div className="quiet-hours-display">
                  <div className="quiet-hours-time">
                    <span className="quiet-hours-label">
                      {t('settings.notifications.quietHours.startTimeLabel')}:
                    </span>
                    <span className="quiet-hours-value">{quietStart}</span>
                  </div>
                  <div className="quiet-hours-time">
                    <span className="quiet-hours-label">
                      {t('settings.notifications.quietHours.endTimeLabel')}:
                    </span>
                    <span className="quiet-hours-value">{quietEnd}</span>
                  </div>
                </div>
              </div>

              <div className="quiet-hours-controls">
                <div className="form-group">
                  <label className="form-label">
                    {t('settings.notifications.quietHours.startTime')}
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('settings.notifications.quietHours.endTime')}
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleSaveQuietHours}
                  disabled={quietHoursLoading}
                >
                  {quietHoursLoading
                    ? t('settings.notifications.quietHours.saving')
                    : t('settings.notifications.quietHours.save')}
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t('settings.actions.title')}</h2>
            </div>

            <div className="action-buttons">
              <button onClick={handleLogout} className="btn btn-outline w-full">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 3a2 2 0 012-2h1a1 1 0 000 2H5v12h1a1 1 0 100 2H5a2 2 0 01-2-2V3zM13.293 12.707a1 1 0 010-1.414L15.586 9H8a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414z"
                    fill="currentColor"
                  />
                </svg>
                {t('settings.actions.logout')}
              </button>

              <button className="btn btn-secondary w-full" disabled>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" fill="currentColor" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                    fill="currentColor"
                  />
                </svg>
                {t('settings.actions.exportData')}
              </button>

              <button className="btn btn-outline danger w-full" disabled>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm5 3a1 1 0 000 2h2a1 1 0 100-2H9z"
                    fill="currentColor"
                  />
                </svg>
                {t('settings.actions.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
