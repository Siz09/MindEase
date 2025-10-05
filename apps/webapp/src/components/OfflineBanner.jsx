import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/OfflineBanner.css';

const OfflineBanner = () => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner">
      <div className="offline-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="offline-icon">
          <path
            d="M10 1L3 9v9h4v-6h6v6h4V9l-7-7z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path d="M8 8l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <span className="offline-text">
          {t('offline.banner.message', "You're offline — AI summaries are disabled.")}
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
