'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const VoiceModeTutorial = ({ isOpen, onClose, onDontShowAgain }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [dontShow, setDontShow] = useState(false);

  const handleClose = useCallback(() => {
    if (dontShow && onDontShowAgain) {
      onDontShowAgain();
    }
    onClose?.();
  }, [dontShow, onDontShowAgain, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-xl, 12px)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.2s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-tutorial-title"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--spacing-lg, 1.5rem)',
            borderBottom: '1px solid var(--border-primary, #e5e7eb)',
          }}
        >
          <h2
            id="voice-tutorial-title"
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary, #111827)',
              margin: 0,
            }}
          >
            {t('chat.voiceTutorial.title') || 'Voice Conversation Mode'}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close tutorial"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-tertiary, #6b7280)',
              padding: '4px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary, #f3f4f6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: 'var(--spacing-lg, 1.5rem)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <p
              style={{
                color: 'var(--text-secondary, #4b5563)',
                lineHeight: 1.6,
                marginBottom: '1rem',
              }}
            >
              {t('chat.voiceTutorial.description') ||
                "Voice Conversation Mode allows you to have a natural conversation with the AI using your voice. Here's how it works:"}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary, #f9fafb)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-green, #10b981)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                    {t('chat.voiceTutorial.step1.title') || 'Start Voice Mode'}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary, #4b5563)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('chat.voiceTutorial.step1.description') ||
                      'Click the microphone button in the chat input to start voice conversation mode.'}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary, #f9fafb)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-green, #10b981)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                    {t('chat.voiceTutorial.step2.title') || 'Speak Naturally'}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary, #4b5563)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('chat.voiceTutorial.step2.description') ||
                      "Speak your message. You'll see your words appear in real-time as you speak. The AI will automatically respond when you finish."}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary, #f9fafb)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-green, #10b981)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                    {t('chat.voiceTutorial.step3.title') || 'Listen to Responses'}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary, #4b5563)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('chat.voiceTutorial.step3.description') ||
                      "The AI's responses will be read aloud automatically. You can interrupt by speaking again."}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary, #f9fafb)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-green, #10b981)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  4
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                    {t('chat.voiceTutorial.step4.title') || 'Stop When Done'}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary, #4b5563)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('chat.voiceTutorial.step4.description') ||
                      'Click the stop button or the microphone button again to exit voice conversation mode.'}
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-warning, #fef3c7)',
                borderRadius: '8px',
                border: '1px solid var(--border-warning, #fbbf24)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-warning, #92400e)' }}>
                <strong>{t('chat.voiceTutorial.tip.title') || 'Tip:'}</strong>{' '}
                {t('chat.voiceTutorial.tip.description') ||
                  'Make sure your microphone permissions are enabled in your browser settings for the best experience.'}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md, 1rem)',
            padding: 'var(--spacing-lg, 1.5rem)',
            borderTop: '1px solid var(--border-primary, #e5e7eb)',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-secondary, #4b5563)',
            }}
          >
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            {t('chat.voiceTutorial.dontShowAgain') || "Don't show this again"}
          </label>
          <button
            onClick={handleClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary-green, #10b981)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--primary-green-dark, #059669)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--primary-green, #10b981)';
            }}
          >
            {t('chat.voiceTutorial.gotIt') || 'Got it!'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceModeTutorial;
