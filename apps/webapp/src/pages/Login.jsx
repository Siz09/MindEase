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
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="35" fill="var(--primary-green)" opacity="0.1" />
                  <path
                    d="M30 40c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z"
                    fill="var(--primary-green)"
                  />
                  <path
                    d="M20 40c0-11 9-20 20-20s20 9 20 10"
                    stroke="var(--primary-green)"
                    strokeWidth="3"
                    fill="none"
                  />
                </svg>
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
