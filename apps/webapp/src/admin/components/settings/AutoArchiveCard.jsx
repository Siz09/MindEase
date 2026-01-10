import AdminCard from '../AdminCard';

const AutoArchiveCard = ({ autoArchive, autoArchiveDays, onToggle, onDaysChange, onDaysBlur }) => {
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
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="8" y1="4" x2="8" y2="22" />
            <line x1="16" y1="4" x2="16" y2="22" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">Auto-archive crisis flags</h2>
          <p className="mt-1 text-sm text-gray-600">
            Automatically archive crisis flags after a specified period.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Enable auto-archive</div>
            <div className="mt-1 text-sm text-gray-600">
              Automatically archive old crisis flags to keep the system clean.
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={autoArchive}
              onChange={(e) => onToggle(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-6 w-11 rounded-full bg-gray-200 transition peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 peer-checked:bg-primary-500">
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </span>
          </label>
        </div>

        {autoArchive && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="admin-auto-archive-days" className="text-sm font-medium text-gray-900">
              Archive after
            </label>
            <div className="flex w-full max-w-xs items-center gap-2">
              <input
                id="admin-auto-archive-days"
                type="number"
                min="1"
                max="365"
                value={autoArchiveDays}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!Number.isNaN(value) && value >= 1 && value <= 365) {
                    onDaysChange(value);
                  }
                }}
                onBlur={onDaysBlur}
                className="input-field w-28"
              />
              <span className="text-sm text-gray-600">days</span>
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  );
};

export default AutoArchiveCard;
