const UserStats = ({ stats }) => {
  const safeStats = {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    banned: stats?.banned ?? 0,
    inactive: stats?.inactive ?? 0,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-gray-200">
        <div className="text-sm font-medium text-gray-600">Total users</div>
        <div className="mt-2 text-2xl font-semibold text-gray-900">{safeStats.total}</div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-gray-200">
        <div className="text-sm font-medium text-gray-600">Active</div>
        <div className="mt-2 text-2xl font-semibold text-green-700">{safeStats.active}</div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-gray-200">
        <div className="text-sm font-medium text-gray-600">Banned</div>
        <div className="mt-2 text-2xl font-semibold text-red-700">{safeStats.banned}</div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-gray-200">
        <div className="text-sm font-medium text-gray-600">Inactive</div>
        <div className="mt-2 text-2xl font-semibold text-amber-700">{safeStats.inactive}</div>
      </div>
    </div>
  );
};

export default UserStats;
