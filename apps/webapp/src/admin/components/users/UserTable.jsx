import { Pagination, Table } from '../shared';
import UserActions from './UserActions';
import UserFilters from './UserFilters';

const tableColumns = [
  { key: 'email', label: 'Email' },
  { key: 'createdAt', label: 'Joined' },
  { key: 'status', label: 'Status' },
  { key: 'subscriptionPlan', label: 'Plan' },
  { key: 'subscriptionStatus', label: 'Sub Status' },
  { key: 'flags', label: 'Crisis Flags' },
  { key: 'actions', label: 'Actions' },
];

const UserTable = ({
  users,
  loading,
  totalUsers,
  page,
  totalPages,
  onPageChange,
  filters,
  onSearch,
  onStatusChange,
  onClearFilters,
  onUserClick,
  onEditUser,
  onDeleteUser,
}) => {
  const displayData = (users || []).map((user) => ({
    ...user,
    email: user.email || user.userId || 'Unknown',
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
    status: user.status || 'active',
    subscriptionPlan: user.subscriptionPlan || 'Free',
    subscriptionStatus: user.subscriptionStatus || 'none',
    flags: user.crisisFlags || 0,
    actions: <UserActions user={user} onEdit={onEditUser} onDelete={onDeleteUser} />,
  }));

  return (
    <div className="admin-user-table-card">
      <div className="admin-user-table-header">
        <div>
          <h2 className="admin-user-table-title">Users</h2>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            Showing {users.length} of {totalUsers}
          </div>
        </div>

        <UserFilters
          filters={filters}
          onSearch={onSearch}
          onStatusChange={onStatusChange}
          onClear={onClearFilters}
        />
      </div>

      <div style={{ padding: 'var(--spacing-lg)' }}>
        <Table
          columns={tableColumns}
          data={displayData}
          loading={loading}
          onRowClick={onUserClick}
          sortable={true}
          empty="No users found"
        />
      </div>

      <div style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
};

export default UserTable;

