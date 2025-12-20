import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const LanguageSettingsSection = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    setCurrentLanguage(i18n.language || 'en');
  }, [i18n.language]);

  const handleLanguageChange = (newLanguage) => {
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
    toast.success(t('settings.notifications.languageChanged'));
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
  );
};

export default LanguageSettingsSection;

