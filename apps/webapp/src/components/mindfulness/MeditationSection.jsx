import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import MeditationTimer from './MeditationTimer';

const MeditationSection = () => {
  const { t } = useTranslation();

  return (
    <div className="tool-card">
      <h3>{t('mindfulness.tools.meditation', 'Meditation Timer')}</h3>
      <MeditationTimer
        onComplete={async (data) => {
          toast.success(t('mindfulness.meditation.completed', 'Meditation completed!'));
          try {
            await api.post('/mindfulness/sessions/virtual/complete', {
              durationMinutes: data.presetDuration,
              type: 'meditation',
            });
          } catch (error) {
            console.error('Error tracking meditation:', error);
            toast.error(
              t(
                'mindfulness.meditation.trackingError',
                'Failed to track session. Please try again.'
              )
            );
          }
        }}
        onMoodCheckIn={(phase, payload, callback) => {
          if (phase === 'pre' && typeof callback === 'function') {
            callback(payload?.mood ?? null);
            return;
          }
          if (phase === 'post' && payload) {
            console.log('Mood check-in:', { phase, ...payload });
          }
        }}
      />
    </div>
  );
};

export default MeditationSection;
