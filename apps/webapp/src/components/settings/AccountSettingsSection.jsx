import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const AccountSettingsSection = ({ currentUser, updateUser, convertAnonymousToFull, logout }) => {
  const { t } = useTranslation();
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertEmail, setConvertEmail] = useState('');
  const [convertPassword, setConvertPassword] = useState('');
  const [convertConfirmPassword, setConvertConfirmPassword] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState('');

  useEffect(() => {
    if (currentUser) setAnonymousMode(currentUser.anonymousMode || false);
  }, [currentUser]);

  const handleToggleAnonymousMode = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await updateUser({ anonymousMode: !anonymousMode });
      if (result.success) {
        setAnonymousMode(!anonymousMode);
        toast.success(
          anonymousMode
            ? t('settings.notifications.anonymousModeDisabled')
            : t('settings.notifications.anonymousModeEnabled')
        );
      } else {
        toast.error(t('settings.notifications.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating anonymous mode:', error);
      toast.error(t('settings.notifications.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleConvertAnonymous = async () => {
    setConvertError('');

    if (!convertEmail || !convertPassword || !convertConfirmPassword) {
      setConvertError('All fields are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(convertEmail)) {
      setConvertError('Please enter a valid email address');
      return;
    }

    const passwordRules = {
      minLength: convertPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(convertPassword),
      hasLowerCase: /[a-z]/.test(convertPassword),
      hasNumber: /\d/.test(convertPassword),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(convertPassword),
    };

    if (!Object.values(passwordRules).every(Boolean)) {
      setConvertError(t('auth.passwordNotMeetRequirements'));
      return;
    }

    if (convertPassword !== convertConfirmPassword) {
      setConvertError('Passwords do not match');
      return;
    }

    setConvertLoading(true);
    try {
      const result = await convertAnonymousToFull(convertEmail, convertPassword);
      if (result.success) {
        setShowConvertForm(false);
        setConvertEmail('');
        setConvertPassword('');
        setConvertConfirmPassword('');
        setAnonymousMode(false);
      } else {
        setConvertError(result.error || 'Failed to convert account');
      }
    } catch {
      setConvertError('An unexpected error occurred');
    } finally {
      setConvertLoading(false);
    }
  };

  return (
    <>
      {currentUser &&
        currentUser.anonymousMode === true &&
        (!currentUser.email || currentUser.email.startsWith('anonymous_')) && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Convert to Full Account</h2>
            </div>

            <div className="convert-anonymous-info">
              <p className="setting-description">
                You're currently using an anonymous account. Convert to a full account to:
              </p>
              <ul className="benefits-list">
                <li>Keep your data permanently</li>
                <li>Access your account from any device</li>
                <li>Receive personalized recommendations</li>
                <li>Enable email notifications</li>
              </ul>

              {!showConvertForm ? (
                <button className="btn btn-primary" onClick={() => setShowConvertForm(true)}>
                  Convert to Full Account
                </button>
              ) : (
                <div className="convert-form">
                  {convertError && <div className="error-message">{convertError}</div>}

                  <div className="form-group">
                    <label htmlFor="convert-email" className="form-label">
                      Email
                    </label>
                    <input
                      id="convert-email"
                      className="form-input"
                      type="email"
                      value={convertEmail}
                      onChange={(e) => setConvertEmail(e.target.value)}
                      disabled={convertLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="convert-password" className="form-label">
                      Password
                    </label>
                    <input
                      id="convert-password"
                      className="form-input"
                      type="password"
                      value={convertPassword}
                      onChange={(e) => setConvertPassword(e.target.value)}
                      disabled={convertLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="convert-confirm-password" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      id="convert-confirm-password"
                      className="form-input"
                      type="password"
                      value={convertConfirmPassword}
                      onChange={(e) => setConvertConfirmPassword(e.target.value)}
                      disabled={convertLoading}
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleConvertAnonymous}
                      disabled={convertLoading}
                    >
                      {convertLoading ? 'Converting...' : 'Convert Account'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowConvertForm(false);
                        setConvertError('');
                        setConvertEmail('');
                        setConvertPassword('');
                        setConvertConfirmPassword('');
                      }}
                      disabled={convertLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('settings.privacy.title')}</h2>
        </div>

        <div className="form-group">
          <label className="form-label toggle-label">
            <div className="toggle-info">
              <span className="toggle-title">{t('settings.privacy.anonymousMode')}</span>
              <p className="setting-description">{t('settings.privacy.anonymousModeDescription')}</p>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={anonymousMode}
                onChange={handleToggleAnonymousMode}
                disabled={loading}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>
        </div>

        <div className="privacy-info">
          <h4>{t('settings.privacy.dataRetention')}</h4>
          <p className="setting-description">{t('settings.privacy.dataRetentionDescription')}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('settings.actions.title')}</h2>
        </div>

        <div className="action-buttons">
          <button onClick={logout} className="btn btn-outline w-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 3a2 2 0 012-2h1a1 1 0 000 2H5v12h1a1 1 0 100 2H5a2 2 0 01-2-2V3zM13.293 12.707a1 1 0 010-1.414L15.586 9H8a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414z"
                fill="currentColor"
              />
            </svg>
            {t('settings.actions.logout')}
          </button>

          <button className="btn btn-secondary w-full" disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" fill="currentColor" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                fill="currentColor"
              />
            </svg>
            {t('settings.actions.exportData')}
          </button>

          <button className="btn btn-outline danger w-full" disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm5 3a1 1 0 000 2h2a1 1 0 100-2H9z"
                fill="currentColor"
              />
            </svg>
            {t('settings.actions.deleteAccount')}
          </button>
        </div>
      </div>
    </>
  );
};

export default AccountSettingsSection;
