import AdminCard from '../AdminCard';

const EmailNotificationsCard = ({ emailNotifications, onChange = () => {} }) => {
  const options = [
    {
      value: 'all',
      title: 'All events',
      description: 'Receive notifications for all system events.',
    },
    {
      value: 'critical',
      title: 'Critical only',
      description: 'Only receive notifications for critical events.',
    },
    {
      value: 'none',
      title: 'None',
      description: 'Disable all email notifications.',
    },
  ];

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
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">Email notifications</h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose which events trigger email notifications.
          </p>
        </div>
      </div>
      <fieldset className="mt-6 space-y-3">
        <legend className="text-sm font-medium text-gray-900">Notification level</legend>
        {options.map((opt) => {
          const checked = emailNotifications === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                checked
                  ? 'border-primary-200 bg-primary-50/50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="notifications"
                value={opt.value}
                checked={checked}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 h-4 w-4 flex-none accent-primary-500"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{opt.title}</div>
                <div className="mt-1 text-sm text-gray-600">{opt.description}</div>
              </div>
            </label>
          );
        })}
      </fieldset>
    </AdminCard>
  );
};

export default EmailNotificationsCard;
