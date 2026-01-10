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
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your admin preferences and system configuration.
        </p>
      </header>

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

      <div className="mt-8">
        <AdminSettingsActions onSave={save} onReset={reset} isLoading={isLoading} />
      </div>
    </div>
  );
}
