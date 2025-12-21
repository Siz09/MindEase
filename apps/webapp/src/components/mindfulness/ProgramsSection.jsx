import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import GuidedProgramList from '../GuidedProgramList';

const ProgramsSection = () => {
  const { t } = useTranslation();
  const [guidedPrograms, setGuidedPrograms] = useState([]);

  const fetchGuidedPrograms = useCallback(async () => {
    try {
      const res = await api.get('/guided-programs');
      if (res.data.success && Array.isArray(res.data.programs)) {
        setGuidedPrograms(res.data.programs);
      } else {
        setGuidedPrograms([]);
      }
    } catch (error) {
      console.error('Error fetching guided programs:', error);
      setGuidedPrograms([]);
    }
  }, []);

  useEffect(() => {
    fetchGuidedPrograms();
  }, [fetchGuidedPrograms]);

  return (
    <>
      <h3>{t('mindfulness.exercises', 'Guided Programs')}</h3>
      <GuidedProgramList programs={guidedPrograms} />
    </>
  );
};

export default ProgramsSection;
