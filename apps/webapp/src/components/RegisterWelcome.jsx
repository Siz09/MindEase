import { useTranslation } from 'react-i18next';

const RegisterWelcome = () => {
  const { t } = useTranslation();

  return (
    <div className="auth-welcome">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="35" fill="var(--accent-lime)" opacity="0.2" />
            <path
              d="M25 40l10 10 20-20"
              stroke="var(--primary-green)"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        </div>
        <h1 className="welcome-title">{t('auth.joinMindEase')}</h1>
        <p className="welcome-subtitle">{t('auth.registerSubtitle')}</p>

        <div className="benefits-list">
          <div className="benefit-item">
            <div className="benefit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 9v9h6v-6h6v6h6V9l-9-7z" fill="var(--primary-green)" />
              </svg>
            </div>
            <div className="benefit-text">
              <h4>{t('auth.benefit1Title')}</h4>
              <p>{t('auth.benefit1Description')}</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"
                  stroke="var(--primary-green)"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M8 8h8M8 12h8M8 16h6" stroke="var(--primary-green)" strokeWidth="2" />
              </svg>
            </div>
            <div className="benefit-text">
              <h4>{t('auth.benefit2Title')}</h4>
              <p>{t('auth.benefit2Description')}</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="var(--primary-green)" />
                <path
                  d="M12 1l3 6 6-3-3 6 3 6-6-3-3 6-3-6-6 3 3-6-3-6 6 3 3-6z"
                  stroke="var(--primary-green)"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
            <div className="benefit-text">
              <h4>{t('auth.benefit3Title')}</h4>
              <p>{t('auth.benefit3Description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterWelcome;

