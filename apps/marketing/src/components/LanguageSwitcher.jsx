import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || 'en';

  const toggle = () => {
    const next = current.startsWith('ne') ? 'en' : 'ne';
    i18n.changeLanguage(next);
    localStorage.setItem('i18nextLng', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle language"
      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd' }}
    >
      {current.startsWith('ne') ? 'EN' : 'ने'}
    </button>
  );
}
