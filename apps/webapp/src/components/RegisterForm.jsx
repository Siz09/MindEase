import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterForm = () => {
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
  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const passwordRules = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const isEmailValid = emailRegex.test(formData.email);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      const SEND_VERIFICATION_EMAIL = false;
      const AUTO_REDIRECT_AFTER_REGISTRATION = true;
      const result = await register(
        formData.email,
        formData.password,
        SEND_VERIFICATION_EMAIL,
        AUTO_REDIRECT_AFTER_REGISTRATION
      );
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
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
    } catch (err) {
      setError(t('auth.anonymousError'));
    } finally {
      setLoading(false);
    }
  };

  return (
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
              onBlur={() => setEmailTouched(true)}
              className={`form-input ${emailTouched && formData.email && !isEmailValid ? 'form-input-error' : ''}`}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
            {emailTouched && formData.email && !isEmailValid && (
              <p className="validation-error-text">{t('auth.invalidEmailFormat')}</p>
            )}
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
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  timeoutRef.current = setTimeout(() => setShowPasswordRequirements(false), 200);
                }}
                className={`form-input ${formData.password && !isPasswordValid ? 'form-input-error' : ''}`}
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                aria-label={isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
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

            {showPasswordRequirements && formData.password && (
              <div className="password-requirements">
                <div className={`requirement ${passwordRules.minLength ? 'met' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    {passwordRules.minLength && (
                      <path d="M4 8l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                    )}
                  </svg>
                  <span>{t('auth.passwordRequirement.minLength')}</span>
                </div>
                <div className={`requirement ${passwordRules.hasUpperCase ? 'met' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    {passwordRules.hasUpperCase && (
                      <path d="M4 8l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                    )}
                  </svg>
                  <span>{t('auth.passwordRequirement.uppercase')}</span>
                </div>
                <div className={`requirement ${passwordRules.hasLowerCase ? 'met' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    {passwordRules.hasLowerCase && (
                      <path d="M4 8l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                    )}
                  </svg>
                  <span>{t('auth.passwordRequirement.lowercase')}</span>
                </div>
                <div className={`requirement ${passwordRules.hasNumber ? 'met' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    {passwordRules.hasNumber && (
                      <path d="M4 8l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                    )}
                  </svg>
                  <span>{t('auth.passwordRequirement.number')}</span>
                </div>
                <div className={`requirement ${passwordRules.hasSpecialChar ? 'met' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    {passwordRules.hasSpecialChar && (
                      <path d="M4 8l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                    )}
                  </svg>
                  <span>{t('auth.passwordRequirement.specialChar')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              {t('auth.confirmPassword')}
            </label>
            <div className="password-input-wrapper">
              <input
                type={isConfirmPasswordVisible ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => setConfirmPasswordTouched(true)}
                className={`form-input ${
                  confirmPasswordTouched &&
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? 'form-input-error'
                    : ''
                }`}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                aria-label={
                  isConfirmPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')
                }
              >
                {isConfirmPasswordVisible ? (
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
            {confirmPasswordTouched &&
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="validation-error-text">{t('auth.passwordMismatch')}</p>
              )}
          </div>

          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
            disabled={
              loading ||
              !isEmailValid ||
              !isPasswordValid ||
              formData.password !== formData.confirmPassword
            }
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
  );
};

export default RegisterForm;
