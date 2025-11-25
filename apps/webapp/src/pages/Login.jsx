'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAuth } from '../admin/AdminAuthContext';
import '../styles/Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const { login, loginAnonymously } = useAuth();
  const { adopt, adminToken } = useAdminAuth();
  const navigate = useNavigate();

  // If an admin session already exists, go straight to /admin
  // This makes new tabs land on the admin dashboard instead of /login
  useEffect(() => {
    if (adminToken) navigate('/admin', { replace: true });
  }, [adminToken, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result?.success) {
        const role = result.user?.role || result.user?.authority;
        if (result.isAdmin || role === 'ADMIN' || role === 'ROLE_ADMIN') {
          // Keep admin session isolated: move JWT into admin storage only
          adopt(result.token, result.user);
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(result?.error || result?.message || t('auth.loginError'));
      }
    } catch (error) {
      setError(t('auth.loginError'));
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
                <img src="/mindease-logo.png" alt="MindEase Logo" width="120" height="120" />
              </div>
              <h1 className="welcome-title">{t('auth.welcomeBack')}</h1>
              <p className="welcome-subtitle">{t('auth.loginSubtitle')}</p>

              <div className="features-list">
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fill="var(--primary-green)"
                    />
                  </svg>
                  <span>{t('auth.feature1')}</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fill="var(--primary-green)"
                    />
                  </svg>
                  <span>{t('auth.feature2')}</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fill="var(--primary-green)"
                    />
                  </svg>
                  <span>{t('auth.feature3')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="auth-form-section">
            <div className="auth-form-container">
              <div className="form-header">
                <h2 className="form-title">{t('auth.signIn')}</h2>
                <p className="form-subtitle">{t('auth.signInSubtitle')}</p>
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
                  <div className="password-input-wrapper">
                    <input
                      type={isPasswordVisible ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                      placeholder={t('auth.passwordPlaceholder')}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                      aria-label={
                        isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')
                      }
                    >
                      {isPasswordVisible ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M1.5 12C2.7 9.91 4.4 8.19 6.4 7A10.94 10.94 0 0112 5.5c2 0 3.9.5 5.6 1.5 2 1.19 3.7 2.91 4.9 5-1.2 2.09-2.9 3.81-4.9 5A10.94 10.94 0 0112 18.5c-2 0-3.9-.5-5.6-1.5C4.4 15.81 2.7 14.09 1.5 12z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 3l18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10.58 10.58a3 3 0 004.24 4.24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9.88 5.09A10.94 10.94 0 0121 12c-1.2 2.09-2.9 3.81-4.9 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6.1 6.1C4.21 7.35 2.67 9.02 1.5 11c1.2 2.09 2.9 3.81 4.9 5a10.94 10.94 0 005.6 1.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    t('auth.signIn')
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
                  t('auth.continueAnonymously')
                )}
              </button>

              <div className="form-footer">
                <p>
                  {t('auth.noAccount')}{' '}
                  <Link to="/register" className="auth-link">
                    {t('auth.signUp')}
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

export default Login;
