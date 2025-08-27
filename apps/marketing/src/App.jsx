import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import * as Sentry from '@sentry/react';

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button style={{ padding: '8px 14px' }}>{t('cta')}</button>
          <button 
            style={{ padding: '8px 14px', backgroundColor: '#dc2626', color: 'white' }}
            onClick={() => Sentry.captureException(new Error("Test error from Marketing"))}
          >
            Test Sentry
          </button>
        </div>
      </main>
    </div>
  );
}
