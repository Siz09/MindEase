import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import AccountSettingsSection from '../components/settings/AccountSettingsSection';
import AIProviderSection from '../components/settings/AIProviderSection';
import LanguageSettingsSection from '../components/settings/LanguageSettingsSection';
import VoiceSettingsSection from '../components/settings/VoiceSettingsSection';
import { Settings as SettingsIcon, User, Mic, Globe, Bot } from 'lucide-react';
import '../styles/Settings.css';

const Settings = () => {
  const { t } = useTranslation();
  const { currentUser, updateUser, convertAnonymousToFull, logout } = useAuth();

  if (!currentUser) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <Card className="text-center">
            <CardHeader className="py-12">
              <div className="flex flex-col items-center gap-4">
                <SettingsIcon className="h-16 w-16 text-gray-400" />
                <div>
                  <CardTitle className="text-2xl mb-2">{t('settings.title')}</CardTitle>
                  <CardDescription>Please log in to access settings</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="flex items-center justify-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {t('settings.title')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-center">{t('settings.subtitle')}</p>
        </div>

        {/* Settings Grid */}
        <div className="settings-grid">
          {/* Account Settings */}
          <div className="settings-section">
            <div className="section-header">
              <User className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('settings.account.title', 'Account')}
              </h2>
            </div>
            <AccountSettingsSection
              currentUser={currentUser}
              updateUser={updateUser}
              convertAnonymousToFull={convertAnonymousToFull}
              logout={logout}
            />
          </div>

          {/* Language Settings */}
          <div className="settings-section">
            <div className="section-header">
              <Globe className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('settings.language.title')}
              </h2>
            </div>
            <LanguageSettingsSection />
          </div>

          {/* AI Provider */}
          <div className="settings-section">
            <div className="section-header">
              <Bot className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                AI Assistant
              </h2>
            </div>
            <AIProviderSection currentUser={currentUser} />
          </div>

          {/* Voice Settings */}
          <div className="settings-section">
            <div className="section-header">
              <Mic className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('settings.voiceSettings')}
              </h2>
            </div>
            <VoiceSettingsSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
