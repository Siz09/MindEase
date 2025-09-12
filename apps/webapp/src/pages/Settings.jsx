'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Settings.css';

const Settings = () => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="page settings-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('navigation.settings')}</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>

        <div className="settings-content">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Account Information</h2>
            </div>

            {currentUser && (
              <div className="account-info">
                <p>
                  <strong>Email:</strong> {currentUser.email || 'Anonymous User'}
                </p>
                <p>
                  <strong>Account Type:</strong>{' '}
                  {currentUser.isAnonymous ? 'Anonymous' : 'Registered'}
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                Enable Notifications
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                Dark Mode
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
