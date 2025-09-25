'use client';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ne' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    
    // Show success notification
    toast.success(t('settings.notifications.languageChanged'), {
      position: "top-right",
      autoClose: 2000,
    });
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en' ? 'EN' : 'ने';
  };

  const getAriaLabel = () => {
    const targetLang = i18n.language === 'en' ? 'Nepali' : 'English';
    return `Switch to ${targetLang}`;
  };

  return (
    <button
      onClick={toggleLanguage}
      className="language-switcher"
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      <div className="language-toggle">
        <span className={`lang-option ${i18n.language === 'en' ? 'active' : ''}`}>
          EN
        </span>
        <span className={`lang-option ${i18n.language === 'ne' ? 'active' : ''}`}>
          ने
        </span>
        <div className={`toggle-slider ${i18n.language === 'ne' ? 'right' : 'left'}`}></div>
      </div>
    </button>
  );
};

export default LanguageSwitcher;