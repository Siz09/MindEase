import { useTranslation } from 'react-i18next';

export default function JournalPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '20px' }}>
      <h2>{t('nav.journal')}</h2>
      <p>Journal functionality will be implemented here.</p>
    </div>
  );
}
