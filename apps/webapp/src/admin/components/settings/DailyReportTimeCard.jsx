import AdminCard from '../AdminCard';

const DailyReportTimeCard = ({ dailyReportTime, onChange }) => {
  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e.target.value);
    }
  };

  return (
    <AdminCard className="border border-gray-200 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">Daily report time</h2>
          <p className="mt-1 text-sm text-gray-600">
            Set the time when daily reports are generated and sent.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <label htmlFor="daily-report-time" className="text-sm font-medium text-gray-900">
          Report time
        </label>
        <input
          id="daily-report-time"
          type="time"
          value={dailyReportTime ?? ''}
          onChange={handleChange}
          className="input-field w-48"
        />
      </div>
    </AdminCard>
  );
};

export default DailyReportTimeCard;
