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
    createdAt:
      user.createdAt && !isNaN(new Date(user.createdAt))
        ? new Date(user.createdAt).toLocaleDateString()
        : 'N/A',
    status: user.status || 'active',
    subscriptionPlan: user.subscriptionPlan || 'Free',
    subscriptionStatus: user.subscriptionStatus || 'none',
    flags: user.crisisFlags || 0,
    actions: <UserActions user={user} onEdit={onEditUser} onDelete={onDeleteUser} />,
  }));

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-200">
      <div className="border-b border-gray-200 p-6">
        <UserFilters
          filters={filters}
          onSearch={onSearch}
          onStatusChange={onStatusChange}
          onClear={onClearFilters}
        />
      </div>

      <div className="p-6">
        <Table
          columns={tableColumns}
          data={displayData}
          loading={loading}
          onRowClick={onUserClick}
          sortable={true}
          empty="No users found"
        />
      </div>

      <div className="border-t border-gray-200 p-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalUsers}
        />
      </div>
    </div>
  );
};

export default UserTable;
