import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
// REMOVE THIS LINE: import * as Sentry from '@sentry/react';

export default function App() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('header.title')}</h1>
        <LanguageSwitcher />
      </header>
      <nav style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
        <a href="/">{t('nav.home')}</a>
        <a href="/chat">{t('nav.chat')}</a>
      </nav>
      <main>
        <input placeholder={t('chat.placeholder')} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button>{t('action.send')}</button>
        </div>
      </main>
    </div>
  );
}
