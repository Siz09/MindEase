'use client';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register = () => {
  const { t } = useTranslation();
  const { register, loginAnonymously } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setError(t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginAnonymously();
      navigate('/');
    } catch (error) {
      setError(t('auth.anonymousError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          {/* Left Side - Welcome Section */}
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
                      <path
                        d="M8 8h8M8 12h8M8 16h6"
                        stroke="var(--primary-green)"
                        strokeWidth="2"
                      />
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

          {/* Right Side - Register Form */}
          <div className="auth-form-section">
            <div className="auth-form-container">
              <div className="form-header">
                <h2 className="form-title">{t('auth.createAccount')}</h2>
                <p className="form-subtitle">{t('auth.createAccountSubtitle')}</p>
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
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      {t('auth.creatingAccount')}
                    </>
                  ) : (
                    t('auth.createAccount')
                  )}
                </button>
              </form>

              <div className="form-divider">
                <span>{t('auth.or')}</span>
              </div>

              <button
                onClick={handleAnonymousLogin}
                className={`btn btn-secondary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    {t('auth.continuingAnonymously')}
                  </>
                ) : (
                  t('auth.tryWithoutAccount')
                )}
              </button>

              <div className="form-footer">
                <p>
                  {t('auth.haveAccount')}{' '}
                  <Link to="/login" className="auth-link">
                    {t('auth.signIn')}
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

export default Register;
