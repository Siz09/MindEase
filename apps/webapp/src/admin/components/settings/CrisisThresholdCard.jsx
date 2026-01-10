import AdminCard from '../AdminCard';

const CrisisThresholdCard = ({ crisisThreshold, onChange }) => {
  const level = crisisThreshold > 7 ? 'High' : crisisThreshold > 4 ? 'Medium' : 'Low';
  const levelStyles = {
    High: 'bg-red-50 text-red-700 ring-red-200',
    Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
    Low: 'bg-green-50 text-green-700 ring-green-200',
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
            <path d="M12 3 21 19H3z" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <circle cx="12" cy="17" r="1" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">Crisis alert threshold</h2>
          <p className="mt-1 text-sm text-gray-600">
            Adjust the sensitivity level for crisis detection alerts.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="crisis-threshold-slider" className="text-sm font-medium text-gray-900">
            Sensitivity: {crisisThreshold}/10
          </label>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
              levelStyles[level]
            }`}
            aria-label={`${level} sensitivity`}
          >
            {level}
          </span>
        </div>

        <input
          id="crisis-threshold-slider"
          type="range"
          min="1"
          max="10"
          value={crisisThreshold}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          aria-label="Crisis alert sensitivity level"
          aria-valuemin="1"
          aria-valuemax="10"
          aria-valuenow={crisisThreshold}
          aria-valuetext={`${crisisThreshold} out of 10, ${level} sensitivity`}
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </AdminCard>
  );
};

export default CrisisThresholdCard;
