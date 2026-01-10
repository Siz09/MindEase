import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Separator } from '../ui/Separator';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Shield, LogOut, Download, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

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

  const handleToggleAnonymousMode = async (checked) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await updateUser({ anonymousMode: checked });
      if (result.success) {
        setAnonymousMode(checked);
        toast.success(
          checked
            ? t('settings.notifications.anonymousModeEnabled')
            : t('settings.notifications.anonymousModeDisabled')
        );
      } else {
        toast.error(t('settings.notifications.updateFailed'));
      }
    } catch {
      toast.error(t('settings.notifications.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleConvertAnonymous = async () => {
    setConvertError('');

    if (!convertEmail || !convertPassword || !convertConfirmPassword) {
      setConvertError(t('auth.allFieldsRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(convertEmail)) {
      setConvertError(t('auth.invalidEmail'));
      return;
    }

    const passwordRules = {
      minLength: convertPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(convertPassword),
      hasLowerCase: /[a-z]/.test(convertPassword),
      hasNumber: /\d/.test(convertPassword),
      hasSpecialChar: /[^A-Za-z0-9\s]/.test(convertPassword),
    };

    if (!Object.values(passwordRules).every(Boolean)) {
      setConvertError(t('auth.passwordNotMeetRequirements'));
      return;
    }

    if (convertPassword !== convertConfirmPassword) {
      setConvertError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setConvertLoading(true);
    try {
      const result = await convertAnonymousToFull(convertEmail, convertPassword);
      if (result.success) {
        toast.success(t('settings.notifications.accountConverted'));
        setShowConvertForm(false);
        setConvertEmail('');
        setConvertPassword('');
        setConvertConfirmPassword('');
        setAnonymousMode(false);
      } else {
        setConvertError(result.error || t('auth.convertAccountFailed'));
      }
    } catch (error) {
      setConvertError(error?.message || t('auth.unexpectedError'));
    } finally {
      setConvertLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Convert Anonymous Account Card */}
      {currentUser &&
        currentUser.anonymousMode === true &&
        (!currentUser.email || currentUser.email.startsWith('anonymous_')) && (
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>{t('settings.convert.title')}</CardTitle>
              </div>
              <CardDescription>{t('settings.convert.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {[
                  t('settings.convert.benefits.keepData'),
                  t('settings.convert.benefits.accessAnywhere'),
                  t('settings.convert.benefits.recommendations'),
                  t('settings.convert.benefits.notifications'),
                ].map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {!showConvertForm ? (
                <Button
                  variant="primary"
                  onClick={() => setShowConvertForm(true)}
                  className="w-full"
                >
                  {t('settings.convert.cta')}
                </Button>
              ) : (
                <div className="space-y-4">
                  {convertError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{convertError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="convert-email"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t('auth.email')}
                    </label>
                    <Input
                      id="convert-email"
                      type="email"
                      value={convertEmail}
                      onChange={(e) => setConvertEmail(e.target.value)}
                      disabled={convertLoading}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="convert-password"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t('auth.password')}
                    </label>
                    <Input
                      id="convert-password"
                      type="password"
                      value={convertPassword}
                      onChange={(e) => setConvertPassword(e.target.value)}
                      disabled={convertLoading}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="convert-confirm-password"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t('auth.confirmPassword')}
                    </label>
                    <Input
                      id="convert-confirm-password"
                      type="password"
                      value={convertConfirmPassword}
                      onChange={(e) => setConvertConfirmPassword(e.target.value)}
                      disabled={convertLoading}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleConvertAnonymous}
                      disabled={convertLoading}
                      className="flex-1"
                    >
                      {convertLoading
                        ? t('settings.convert.converting')
                        : t('settings.convert.submit')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowConvertForm(false);
                        setConvertError('');
                        setConvertEmail('');
                        setConvertPassword('');
                        setConvertConfirmPassword('');
                      }}
                      disabled={convertLoading}
                      className="flex-1"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Privacy Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>{t('settings.privacy.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {t('settings.privacy.anonymousMode')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.privacy.anonymousModeDescription')}
              </p>
            </div>
            <Switch
              checked={anonymousMode}
              onCheckedChange={handleToggleAnonymousMode}
              disabled={loading}
            />
          </div>

          <Separator className="my-6" />

          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('settings.privacy.dataRetention')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('settings.privacy.dataRetentionDescription')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.actions.title')}</CardTitle>
          <CardDescription>Manage your account and data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" onClick={logout} className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" />
              {t('settings.actions.logout')}
            </Button>

            <Button variant="outline" disabled className="w-full justify-start gap-2 opacity-50">
              <Download className="h-4 w-4" />
              {t('settings.actions.exportData')}
            </Button>

            <Button
              variant="outline"
              disabled
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {t('settings.actions.deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettingsSection;
