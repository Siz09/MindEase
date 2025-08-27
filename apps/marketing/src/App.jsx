import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

export default function App() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('appName')}</h1>
        <LanguageSwitcher />
      </header>
      <main style={{ paddingTop: 24 }}>
        <h2>{t('hero.title')}</h2>
        <p>{t('hero.subtitle')}</p>
        <p>{t('tagline')}</p>
        <button style={{ padding: '8px 14px' }}>{t('cta')}</button>
      </main>
    </div>
  );
}
