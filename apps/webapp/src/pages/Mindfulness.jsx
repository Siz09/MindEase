import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Mindfulness page - Now redirects to Chat
 * Breathing exercises and meditation timers are now integrated into the chat interface.
 * Users can request them by typing messages like "I want to do a breathing exercise" or "meditation timer".
 */
const Mindfulness = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to chat page
    navigate('/chat', { replace: true });
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <p style={{ color: 'var(--text-secondary)' }}>
        {t('mindfulness.redirecting', 'Redirecting to chat...')}
      </p>
    </div>
  );
};

export default Mindfulness;
