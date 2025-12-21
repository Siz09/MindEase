import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import BreathingTimer from './BreathingTimer';

const BreathingSection = () => {
  const { t } = useTranslation();

  return (
    <div className="tool-card">
      <h3>{t('mindfulness.tools.breathing', 'Breathing Exercise')}</h3>
      <BreathingTimer
        onComplete={async () => {
          toast.success(t('mindfulness.breathing.completed', 'Breathing exercise completed!'));
        }}
      />
    </div>
  );
};

export default BreathingSection;

