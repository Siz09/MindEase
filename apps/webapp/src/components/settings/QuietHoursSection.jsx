import { useTranslation } from 'react-i18next';
import { useQuietHours } from '../../hooks/useQuietHours';

const QuietHoursSection = ({ currentUser }) => {
  const { t } = useTranslation();
  const { quietStart, setQuietStart, quietEnd, setQuietEnd, quietHoursLoading, saveQuietHours } =
    useQuietHours({ currentUser, t });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{t('settings.notifications.quietHours.title')}</h2>
      </div>

      <div className="form-group">
        <p className="setting-description">{t('settings.notifications.quietHours.description')}</p>
      </div>

      <div className="quiet-hours-settings">
        <div className="quiet-hours-current">
          <h4>{t('settings.notifications.quietHours.currentSettings')}</h4>
          <div className="quiet-hours-display">
            <div className="quiet-hours-time">
              <span className="quiet-hours-label">
                {t('settings.notifications.quietHours.startTimeLabel')}:
              </span>
              <span className="quiet-hours-value">{quietStart}</span>
            </div>
            <div className="quiet-hours-time">
              <span className="quiet-hours-label">
                {t('settings.notifications.quietHours.endTimeLabel')}:
              </span>
              <span className="quiet-hours-value">{quietEnd}</span>
            </div>
          </div>
        </div>

        <div className="quiet-hours-controls">
          <div className="form-group">
            <label className="form-label">{t('settings.notifications.quietHours.startTime')}</label>
            <input
              type="time"
              className="form-input"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.notifications.quietHours.endTime')}</label>
            <input
              type="time"
              className="form-input"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={saveQuietHours} disabled={quietHoursLoading}>
            {quietHoursLoading
              ? t('settings.notifications.quietHours.saving')
              : t('settings.notifications.quietHours.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuietHoursSection;

