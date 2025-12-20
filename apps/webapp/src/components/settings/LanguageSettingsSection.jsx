import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const LanguageSettingsSection = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    setCurrentLanguage(i18n.language || 'en');
  }, [i18n.language]);

  const handleLanguageChange = async (newLanguage) => {
    try {
      await i18n.changeLanguage(newLanguage);
      localStorage.setItem('i18nextLng', newLanguage);
      toast.success(t('settings.notifications.languageChanged'));
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error(t('settings.notifications.languageChangeFailed'));
    }
  };

  return (
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
            aria-label={t('settings.language.selectEnglish')}
            aria-pressed={currentLanguage === 'en'}
          >
            <span className="language-flag" aria-hidden="true">
              🇺🇸
            </span>
            <span className="language-name">{t('settings.language.english')}</span>
            {currentLanguage === 'en' && (
              <span className="current-indicator" aria-hidden="true">
                ✓
              </span>
            )}
          </button>

          <button
            className={`language-option ${currentLanguage === 'ne' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('ne')}
            disabled={currentLanguage === 'ne'}
            aria-label={t('settings.language.selectNepali')}
            aria-pressed={currentLanguage === 'ne'}
          >
            <span className="language-flag" aria-hidden="true">
              🇳🇵
            </span>
            <span className="language-name">{t('settings.language.nepali')}</span>
            {currentLanguage === 'ne' && (
              <span className="current-indicator" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsSection;
