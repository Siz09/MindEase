'use client';

import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import '../styles/Profile.css';

export default function Profile() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>Profile</h1>
            <p>Please log in to view your profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile</h1>
          <p>Your personal information</p>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="profile-info">
                <h2>{currentUser?.email || 'Anonymous User'}</h2>
                <p className="profile-member-since">
                  Member since {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="profile-details-card">
            <div className="card-header">
              <h3>Account Information</h3>
            </div>
            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">{t('settings.account.email')}:</span>
                <span className="detail-value">{currentUser.email || 'Anonymous User'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('settings.account.accountType')}:</span>
                <span className="detail-value">
                  {currentUser.anonymousMode
                    ? t('settings.account.anonymous')
                    : t('settings.account.registered')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('settings.account.role')}:</span>
                <span className="detail-value">{currentUser.role || 'USER'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-active">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
