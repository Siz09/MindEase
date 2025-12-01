import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Mindfulness.css'; // Reusing existing styles or add new ones

const GuidedProgramList = ({ programs }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStart = (programId) => {
    navigate(`/guided-program/${programId}`);
  };

  if (!programs || programs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🧘</div>
        <h3>{t('mindfulness.noExercisesFound') || 'No exercises available'}</h3>
        <p>{t('mindfulness.checkBackLater') || 'Check back later for new guided programs.'}</p>
      </div>
    );
  }

  // Filter out invalid programs before mapping
  const validPrograms = programs.filter((program) => program && program.id && program.name);

  return (
    <div className="sessions-grid">
      {validPrograms.map((program) => (
        <div key={program.id} className="session-card guided-program-card">
          <div className="session-header">
            <div className="session-type">🧩</div>
            <div className="session-difficulty program-type-badge">
              {program?.programType ?? 'Unknown'}
            </div>
          </div>

          <div className="session-content">
            <h3 className="session-title">{program?.name ?? 'Untitled'}</h3>
            <p className="session-description">{program?.description ?? ''}</p>

            <div className="session-meta">
              <span className="session-duration">
                ⏱️ {program?.estimatedDurationMinutes ?? 0} min
              </span>
              <span className="session-category">🌐 {program?.language ?? 'Unknown'}</span>
            </div>
          </div>

          <div className="session-actions">
            <button
              onClick={() => program?.id && handleStart(program.id)}
              className="btn btn-primary play-btn"
              disabled={!program?.id}
            >
              ▶️ {t('mindfulness.startExercise') || 'Start Exercise'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GuidedProgramList;
