'use client';

import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Mail, Calendar, Shield, CheckCircle2, User } from 'lucide-react';
import '../styles/Profile.css';

export default function Profile() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <Card className="text-center">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <User className="h-16 w-16 text-gray-400" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {t('profile.title', 'Profile')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('profile.pleaseLogin', 'Please log in to view your profile')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const memberSinceDate =
    currentUser?.createdAt && !isNaN(new Date(currentUser.createdAt).getTime())
      ? new Date(currentUser.createdAt).toLocaleDateString()
      : null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('profile.title', 'Profile')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('profile.personalInfo', 'Your personal information')}
          </p>
        </div>

        <div className="profile-content">
          {/* Profile Card with Avatar */}
          <Card className="profile-card-modern">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  <AvatarFallback className="text-3xl md:text-4xl">
                    {(currentUser?.email?.charAt(0) || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {currentUser?.email || t('profile.anonymousUser', 'Anonymous User')}
                  </h2>
                  {memberSinceDate && (
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400 mb-4">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {t('profile.memberSince', 'Member since {{date}}', {
                          date: memberSinceDate,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant={currentUser.anonymousMode ? 'secondary' : 'success'}>
                      {currentUser.anonymousMode
                        ? t('settings.account.anonymous', 'Anonymous')
                        : t('settings.account.registered', 'Registered')}
                    </Badge>
                    {currentUser.status && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {t(
                          `profile.status.${currentUser.status || 'active'}`,
                          currentUser.status || 'Active'
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                {t('profile.accountInformation', 'Account Information')}
              </CardTitle>
              <CardDescription>
                {t('profile.accountDescription', 'View your account details and settings')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('settings.account.email', 'Email')}
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {currentUser.email || t('profile.anonymousUser', 'Anonymous User')}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Account Type */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('settings.account.accountType', 'Account Type')}
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {currentUser.anonymousMode
                          ? t('settings.account.anonymous', 'Anonymous')
                          : t('settings.account.registered', 'Registered')}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Role */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('settings.account.role', 'Role')}
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {currentUser.role || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {currentUser.status && (
                  <>
                    <Separator />
                    {/* Status */}
                    <div className="flex items-start justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t('profile.statusLabel', 'Status')}
                          </p>
                          <p className="text-base font-semibold text-green-600 dark:text-green-400">
                            {t(
                              `profile.status.${currentUser.status || 'active'}`,
                              currentUser.status || 'Active'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
