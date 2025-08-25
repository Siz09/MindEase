import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || 'en';

  const switchTo = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => switchTo('en')} aria-pressed={current.startsWith('en')}>
        EN
      </button>
      <button onClick={() => switchTo('ne')} aria-pressed={current.startsWith('ne')}>
        ने
      </button>
    </div>
  );
}
