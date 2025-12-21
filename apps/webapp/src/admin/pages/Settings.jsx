'use client';

import '../../styles/admin-settings.css';
import useAdminSettings from '../hooks/useAdminSettings';
import AdminSettingsActions from '../components/settings/AdminSettingsActions';
import AdminSettingsNotification from '../components/settings/AdminSettingsNotification';
import AutoArchiveCard from '../components/settings/AutoArchiveCard';
import CrisisThresholdCard from '../components/settings/CrisisThresholdCard';
import DailyReportTimeCard from '../components/settings/DailyReportTimeCard';
import EmailNotificationsCard from '../components/settings/EmailNotificationsCard';

export default function Settings() {
  const {
    crisisThreshold,
    setCrisisThreshold,
    emailNotifications,
    setEmailNotifications,
    autoArchive,
    setAutoArchive,
    autoArchiveDays,
    setAutoArchiveDays,
    dailyReportTime,
    setDailyReportTime,
    notification,
    setNotification,
    isLoading,
    save,
    reset,
  } = useAdminSettings();

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <h1 className="admin-settings-title">Settings</h1>
          <p className="admin-settings-subtitle">
            Manage your admin preferences and system configuration
          </p>
        </div>
      </div>

      <AdminSettingsNotification notification={notification} onDismiss={() => setNotification(null)} />

      <div className="admin-settings-content">
        <CrisisThresholdCard crisisThreshold={crisisThreshold} onChange={setCrisisThreshold} />

        <AutoArchiveCard
          autoArchive={autoArchive}
          autoArchiveDays={autoArchiveDays}
          onToggle={setAutoArchive}
          onDaysChange={setAutoArchiveDays}
          onDaysBlur={(e) => {
            const val = Number(e.target.value);
            if (Number.isNaN(val) || val < 1) {
              setAutoArchiveDays(1);
            } else if (val > 365) {
              setAutoArchiveDays(365);
            }
          }}
        />

        <EmailNotificationsCard
          emailNotifications={emailNotifications}
          onChange={setEmailNotifications}
        />

        <DailyReportTimeCard dailyReportTime={dailyReportTime} onChange={setDailyReportTime} />

        <AdminSettingsActions onSave={save} onReset={reset} isLoading={isLoading} />
      </div>
    </div>
  );
}
