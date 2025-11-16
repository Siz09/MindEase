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
            <h1>{t('profile.title', 'Profile')}</h1>
            <p>{t('profile.pleaseLogin', 'Please log in to view your profile')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>{t('profile.title', 'Profile')}</h1>
          <p>{t('profile.personalInfo', 'Your personal information')}</p>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {(currentUser?.email?.charAt(0) || 'U').toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{currentUser?.email || t('profile.anonymousUser', 'Anonymous User')}</h2>
                {currentUser?.createdAt && !isNaN(new Date(currentUser.createdAt).getTime()) && (
                  <p className="profile-member-since">
                    {t('profile.memberSince', 'Member since {{date}}', {
                      date: new Date(currentUser.createdAt).toLocaleDateString(),
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-details-card">
            <div className="card-header">
              <h3>{t('profile.accountInformation', 'Account Information')}</h3>
            </div>
            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">{t('settings.account.email')}:</span>
                <span className="detail-value">
                  {currentUser.email || t('profile.anonymousUser', 'Anonymous User')}
                </span>
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
                <span className="detail-value">{currentUser.role || '—'}</span>
              </div>
              {currentUser.status && (
                <div className="detail-item">
                  <span className="detail-label">{t('profile.status', 'Status')}:</span>
                  <span
                    className={`detail-value status-${(currentUser.status || 'active').toLowerCase()}`}
                  >
                    {t(
                      `profile.status.${currentUser.status || 'active'}`,
                      currentUser.status || 'Active'
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
