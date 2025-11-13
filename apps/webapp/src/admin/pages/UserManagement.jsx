'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Input,
  Select,
  FilterBar,
  Pagination,
  Modal,
  Badge,
} from '../components/shared';
import adminApi from '../adminApi';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load users
  useEffect(() => {
    loadUsers();
  }, [page, pageSize, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        size: pageSize,
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);

      const { data } = await adminApi
        .get(`/admin/users?${params.toString()}`)
        .catch(() => ({ data: { content: [], totalPages: 0 } }));

      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
    setPage(0);
  };

  const handleStatusFilter = (value) => {
    setFilters({ ...filters, status: value });
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', status: 'all' });
    setPage(0);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return;
    try {
      await adminApi.put(`/admin/users/${userId}`, { status: 'banned' });
      loadUsers();
      setShowModal(false);
    } catch (err) {
      console.error('Failed to ban user:', err);
    }
  };

  const tableColumns = [
    { key: 'email', label: 'Email' },
    { key: 'createdAt', label: 'Joined' },
    { key: 'status', label: 'Status' },
    { key: 'flags', label: 'Flags' },
  ];

  const displayData = users.map((user) => ({
    ...user,
    email: user.email || user.userId || 'Unknown',
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
    status: user.status || 'active',
    flags: user.crisisFlags || 0,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">
          Manage and monitor all platform users. Total: {totalPages * pageSize}+
        </p>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <FilterBar>
          <Input
            placeholder="Search by email or name..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ flex: 1, maxWidth: '300px' }}
          />
          <Select
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'banned', label: 'Banned' },
            ]}
            style={{ width: '180px' }}
          />
          <Button variant="ghost" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </FilterBar>
      </div>

      <div className="bento-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Table
          columns={tableColumns}
          data={displayData}
          loading={loading}
          onRowClick={handleUserClick}
          sortable={true}
          empty="No users found"
        />
      </div>

      <div className="bento-card">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
        />
      </div>

      {/* User Detail Modal */}
      <Modal
        isOpen={showModal}
        title="User Details"
        onClose={() => setShowModal(false)}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="danger" onClick={() => handleBanUser(selectedUser?.id)}>
              Ban User
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* User Info */}
            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Email</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>
                {selectedUser.email || 'N/A'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>User ID</label>
              <p
                style={{
                  margin: '4px 0 0 0',
                  color: 'var(--dark)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                {selectedUser.id || selectedUser.userId || 'N/A'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Status</label>
              <p style={{ margin: '4px 0 0 0' }}>
                <Badge type={selectedUser.status === 'active' ? 'success' : 'secondary'}>
                  {selectedUser.status || 'active'}
                </Badge>
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Joined</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Crisis Flags</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>
                {selectedUser.crisisFlags || 0}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: 'var(--gray)' }}>Last Active</label>
              <p style={{ margin: '4px 0 0 0', color: 'var(--dark)' }}>
                {selectedUser.lastActive
                  ? new Date(selectedUser.lastActive).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
