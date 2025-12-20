'use client';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import AccountSettingsSection from '../components/settings/AccountSettingsSection';
import AIProviderSection from '../components/settings/AIProviderSection';
import LanguageSettingsSection from '../components/settings/LanguageSettingsSection';
import QuietHoursSection from '../components/settings/QuietHoursSection';
import VoiceSettingsSection from '../components/settings/VoiceSettingsSection';
import '../styles/Settings.css';

const Settings = () => {
  const { t } = useTranslation();
  const { currentUser, updateUser, convertAnonymousToFull, logout } = useAuth();

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
          <AccountSettingsSection
            currentUser={currentUser}
            updateUser={updateUser}
            convertAnonymousToFull={convertAnonymousToFull}
            logout={logout}
          />
          <LanguageSettingsSection />
          <AIProviderSection currentUser={currentUser} />
          <QuietHoursSection currentUser={currentUser} />
          <VoiceSettingsSection />
        </div>
      </div>
    </div>
  );
};

export default Settings;

