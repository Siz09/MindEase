import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded-md ${i18n.language === 'en' ? 'bg-accent text-slate-950' : 'text-slate-200'}`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('ne')}
        className={`px-2 py-1 rounded-md ${i18n.language === 'ne' ? 'bg-accent text-slate-950' : 'text-slate-200'}`}
        aria-label="Switch to Nepali"
      >
        ने
      </button>
    </div>
  );
}
