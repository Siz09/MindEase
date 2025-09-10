import { useTranslation } from 'react-i18next';

export default function MoodPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '20px' }}>
      <h2>{t('nav.mood')}</h2>
      <p>Mood tracking functionality will be implemented here.</p>
    </div>
  );
}
