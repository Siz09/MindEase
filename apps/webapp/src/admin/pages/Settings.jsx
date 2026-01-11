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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your admin preferences and system configuration.
        </p>
      </div>

      <AdminSettingsNotification
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      <div className="space-y-6">
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
      </div>

      <AdminSettingsActions onSave={save} onReset={reset} isLoading={isLoading} />
    </div>
  );
}
