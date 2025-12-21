import { useTranslation } from 'react-i18next';

const MoodWellnessTips = () => {
  const { t } = useTranslation();

  return (
    <div className="card tips-card">
      <div className="card-header">
        <h3 className="card-title">{t('mood.wellnessTips') || 'Wellness Tips'}</h3>
      </div>
      <div className="tips-grid">
        <div className="tip-item">
          <div className="tip-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L3 9v9h6v-6h6v6h6V9l-9-7z" fill="var(--primary-green)" />
            </svg>
          </div>
          <div className="tip-content">
            <h4>{t('mood.tip1Title') || 'Rest & Recovery'}</h4>
            <p>{t('mood.tip1Description') || 'Get enough sleep and take breaks when needed.'}</p>
          </div>
        </div>
        <div className="tip-item">
          <div className="tip-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="var(--primary-green)" strokeWidth="2" />
              <path d="M8 12l2 2 4-4" stroke="var(--primary-green)" strokeWidth="2" />
            </svg>
          </div>
          <div className="tip-content">
            <h4>{t('mood.tip2Title') || 'Stay Active'}</h4>
            <p>{t('mood.tip2Description') || 'Regular physical activity improves mood.'}</p>
          </div>
        </div>
        <div className="tip-item">
          <div className="tip-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke="var(--primary-green)"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="tip-content">
            <h4>{t('mood.tip3Title') || 'Connect'}</h4>
            <p>{t('mood.tip3Description') || 'Social connections boost overall well-being.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodWellnessTips;
