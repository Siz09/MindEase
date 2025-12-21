const UserStats = ({ stats }) => {
  return (
    <div className="admin-user-stats">
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Total Users</div>
        <div className="admin-user-stat-value">{stats.total}</div>
      </div>
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Active</div>
        <div className="admin-user-stat-value" style={{ color: 'var(--color-success)' }}>
          {stats.active}
        </div>
      </div>
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Banned</div>
        <div className="admin-user-stat-value" style={{ color: 'var(--color-danger)' }}>
          {stats.banned}
        </div>
      </div>
      <div className="admin-user-stat-card">
        <div className="admin-user-stat-label">Inactive</div>
        <div className="admin-user-stat-value" style={{ color: 'var(--color-warning)' }}>
          {stats.inactive}
        </div>
      </div>
    </div>
  );
};

export default UserStats;

