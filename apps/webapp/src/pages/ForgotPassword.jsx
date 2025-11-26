'use client';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { sendPasswordResetEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }

    if (!isEmailValid) {
      setError(t('auth.invalidEmailFormat'));
      return;
    }

    setLoading(true);

    try {
      const result = await sendPasswordResetEmail(email);

      if (result.success) {
        setEmailSent(true);
      } else {
        setError(result.error || t('auth.passwordResetError'));
      }
    } catch (error) {
      setError(t('auth.passwordResetError'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-content" style={{ gridTemplateColumns: '1fr' }}>
            <div className="auth-form-section" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="auth-form-container">
                <div className="form-header">
                  <div className="success-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="30" fill="var(--success-bg, #d4edda)" />
                      <path
                        d="M20 32l8 8 16-16"
                        stroke="var(--success, #28a745)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <h2 className="form-title">{t('auth.checkYourEmail')}</h2>
                  <p className="form-subtitle">{t('auth.passwordResetEmailSent', { email })}</p>
                </div>

                <div className="info-box">
                  <h4>{t('auth.nextSteps')}</h4>
                  <ol style={{ paddingLeft: '20px', marginTop: '12px' }}>
                    <li>{t('auth.resetStep1')}</li>
                    <li>{t('auth.resetStep2')}</li>
                    <li>{t('auth.resetStep3')}</li>
                  </ol>
                </div>

                <div className="form-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
                  <p>
                    {t('auth.didntReceiveEmail')}{' '}
                    <button
                      onClick={() => setEmailSent(false)}
                      className="auth-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {t('auth.resendEmail')}
                    </button>
                  </p>
                  <p style={{ marginTop: '12px' }}>
                    <Link to="/login" className="auth-link">
                      {t('auth.backToLogin')}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          {/* Left Side - Info Section */}
          <div className="auth-welcome">
            <div className="welcome-content">
              <div className="welcome-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="35" fill="rgba(255, 255, 255, 0.2)" />
                  <path
                    d="M40 20v24M40 52h.01"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h1 className="welcome-title">{t('auth.forgotPasswordTitle')}</h1>
              <p className="welcome-subtitle">{t('auth.forgotPasswordSubtitle')}</p>

              <div className="features-list">
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fill="white"
                    />
                  </svg>
                  <span>{t('auth.resetFeature1')}</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fill="white"
                    />
                  </svg>
                  <span>{t('auth.resetFeature2')}</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fill="white"
                    />
                  </svg>
                  <span>{t('auth.resetFeature3')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Reset Form */}
          <div className="auth-form-section">
            <div className="auth-form-container">
              <div className="form-header">
                <h2 className="form-title">{t('auth.resetPassword')}</h2>
                <p className="form-subtitle">{t('auth.resetPasswordSubtitle')}</p>
              </div>

              {error && (
                <div className="error-message">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading || !isEmailValid}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      {t('auth.sendingResetLink')}
                    </>
                  ) : (
                    t('auth.sendResetLink')
                  )}
                </button>
              </form>

              <div className="form-footer">
                <p>
                  {t('auth.rememberPassword')}{' '}
                  <Link to="/login" className="auth-link">
                    {t('auth.backToLogin')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
