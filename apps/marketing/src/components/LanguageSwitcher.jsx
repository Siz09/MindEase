'use client';

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    if (i18n.language !== lng) i18n.changeLanguage(lng);
  };

  const isEN = (i18n.language || '').startsWith('en');
  const isNE = (i18n.language || '').startsWith('ne');

  return (
    <div className="me-lang" role="group" aria-label="Language switcher">
      <button
        type="button"
        className={`me-lang-btn ${isEN ? 'active' : ''}`}
        aria-pressed={isEN}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        className={`me-lang-btn ${isNE ? 'active' : ''}`}
        aria-pressed={isNE}
        onClick={() => changeLanguage('ne')}
        title="नेपाली"
      >
        नेपाली
      </button>
    </div>
  );
}
