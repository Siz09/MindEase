'use client';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ne' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="language-switcher"
      aria-label={`Switch to ${i18n.language === 'en' ? 'Nepali' : 'English'}`}
    >
      <div className="language-toggle">
        <span className={`lang-option ${i18n.language === 'en' ? 'active' : ''}`}>EN</span>
        <span className={`lang-option ${i18n.language === 'ne' ? 'active' : ''}`}>नेपाली</span>
        <div className={`toggle-slider ${i18n.language === 'ne' ? 'right' : 'left'}`}></div>
      </div>
    </button>
  );
};

export default LanguageSwitcher;
