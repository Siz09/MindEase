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
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const passwordRules = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRules).every((rule) => rule);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(formData.email);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }

    if (!isEmailValid) {
      setError(t('auth.invalidEmailFormat'));
      return;
    }

    if (!formData.password) {
      setError(t('auth.passwordRequired'));
      return;
    }

    if (!isPasswordValid) {
      setError(t('auth.passwordNotMeetRequirements'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.email, formData.password, formData.anonymousMode);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
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
                    className={`form-input ${formData.email && !isEmailValid ? 'form-input-error' : ''}`}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                  />
                  {formData.email && !isEmailValid && (
                    <p className="validation-error-text">{t('auth.invalidEmailFormatHint')}</p>
                  )}
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
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    className={`form-input ${formData.password && !isPasswordValid ? 'form-input-error' : ''}`}
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                  {showPasswordRequirements && formData.password && (
                    <div className="password-requirements">
                      <div className={`requirement ${passwordRules.minLength ? 'met' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                          {passwordRules.minLength && (
                            <path
                              d="M4 8l2 2 4-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          )}
                        </svg>
                        <span>{t('auth.requirement.minLength')}</span>
                      </div>
                      <div className={`requirement ${passwordRules.hasUpperCase ? 'met' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                          {passwordRules.hasUpperCase && (
                            <path
                              d="M4 8l2 2 4-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          )}
                        </svg>
                        <span>{t('auth.requirement.uppercase')}</span>
                      </div>
                      <div className={`requirement ${passwordRules.hasLowerCase ? 'met' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                          {passwordRules.hasLowerCase && (
                            <path
                              d="M4 8l2 2 4-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          )}
                        </svg>
                        <span>{t('auth.requirement.lowercase')}</span>
                      </div>
                      <div className={`requirement ${passwordRules.hasNumber ? 'met' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                          {passwordRules.hasNumber && (
                            <path
                              d="M4 8l2 2 4-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          )}
                        </svg>
                        <span>{t('auth.requirement.number')}</span>
                      </div>
                      <div className={`requirement ${passwordRules.hasSpecialChar ? 'met' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                          {passwordRules.hasSpecialChar && (
                            <path
                              d="M4 8l2 2 4-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          )}
                        </svg>
                        <span>{t('auth.requirement.specialChar')}</span>
                      </div>
                    </div>
                  )}
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
                    className={`form-input ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'form-input-error'
                        : ''
                    }`}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    required
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="validation-error-text">{t('auth.passwordMismatch')}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading || !isEmailValid || !isPasswordValid}
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
