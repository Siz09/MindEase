const UserStats = ({ stats }) => {
  const safeStats = {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    banned: stats?.banned ?? 0,
    inactive: stats?.inactive ?? 0,
  };

  return (
    <div className="admin-user-stats">
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Total Users</div>
        <div className="admin-user-stat-value">{safeStats.total}</div>
      </div>
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Active</div>
        <div className="admin-user-stat-value" style={{ color: 'var(--color-success)' }}>
          {safeStats.active}
        </div>
      </div>
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Banned</div>
        <div className="admin-user-stat-value" style={{ color: 'var(--color-danger)' }}>
          {safeStats.banned}
        </div>
      </div>
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Inactive</div>
        <div className="admin-user-stat-value" style={{ color: 'var(--color-warning)' }}>
          {safeStats.inactive}
        </div>
      </div>
    </div>
  );
};

export default UserStats;
