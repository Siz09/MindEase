'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Settings.css';

const Settings = () => {
  const { t } = useTranslation();
  const { currentUser, updateUser, logout } = useAuth();
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setAnonymousMode(currentUser.anonymousMode || false);
    }
  }, [currentUser]);

  const handleToggleAnonymousMode = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await updateUser({ anonymousMode: !anonymousMode });

      if (result.success) {
        setAnonymousMode(!anonymousMode);
        toast.success(anonymousMode ? 'Anonymous mode disabled' : 'Anonymous mode enabled');
      } else {
        toast.error('Failed to update anonymous mode');
      }
    } catch (error) {
      console.error('Error updating anonymous mode:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="page settings-page">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">{t('navigation.settings')}</h1>
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
          <h1 className="page-title">{t('navigation.settings')}</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>

        <div className="settings-content">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Account Information</h2>
            </div>

            <div className="account-info">
              <p>
                <strong>Email:</strong> {currentUser.email || 'Anonymous User'}
              </p>
              <p>
                <strong>Account Type:</strong>{' '}
                {currentUser.anonymousMode ? 'Anonymous' : 'Registered'}
              </p>
              <p>
                <strong>Role:</strong> {currentUser.role || 'USER'}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Privacy Settings</h2>
            </div>

            <div className="form-group">
              <label className="form-label toggle-label">
                <span>Anonymous Mode</span>
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
              <p className="setting-description">
                When enabled, your data will be automatically deleted after 7 days for enhanced
                privacy.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Actions</h2>
            </div>

            <button onClick={logout} className="btn btn-outline w-full">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
