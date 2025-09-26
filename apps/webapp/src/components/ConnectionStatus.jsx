import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const ConnectionStatus = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // toast.success(t('connection.restored'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(t('connection.lost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  if (isOnline) return null;

  return (
    <div className="connection-status offline">
      <div className="status-indicator"></div>
      <span>{t('connection.offline')}</span>
    </div>
  );
};

export default ConnectionStatus;
