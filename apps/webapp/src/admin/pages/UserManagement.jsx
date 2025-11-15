'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Table,
  Input,
  Select,
  FilterBar,
  Pagination,
  Modal,
  Badge,
  Card,
} from '../components/shared';
import adminApi from '../adminApi';
import '../../styles/admin-user-management.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [banError, setBanError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'USER',
    anonymousMode: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    inactive: 0,
  });

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        size: pageSize,
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);

      const { data } = await adminApi.get(`/admin/users?${params.toString()}`);

      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalUsers(data.totalElements || data.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err.message);
      setUsers([]);
      setTotalPages(0);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/admin/users/stats');
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        banned: data.banned || 0,
        inactive: data.inactive || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers, loadStats]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const handleBanUser = (user) => {
    if (!user?.id) return;
    setUserToBan(user);
    setShowBanConfirm(true);
    setShowModal(false);
  };

  const confirmBan = async () => {
    if (!userToBan?.id) return;
    setBanError(null);
    try {
      const status = userToBan.status === 'banned' ? 'active' : 'banned';
      await adminApi.put(`/admin/users/${userToBan.id}`, { status });
      setNotification({
        type: 'success',
        message: `User ${status === 'banned' ? 'banned' : 'unbanned'} successfully.`,
      });
      await loadUsers();
      await loadStats();
      setShowBanConfirm(false);
      setUserToBan(null);
    } catch (err) {
      console.error('Failed to ban user:', err?.message || err);
      setBanError(err?.message || 'Failed to update user status. Please try again.');
    }
  };

  const cancelBan = () => {
    setShowBanConfirm(false);
    setUserToBan(null);
    setBanError(null);
  };

  const handleDeleteUser = (user) => {
    if (!user?.id) return;
    setUserToDelete(user);
    setShowDeleteConfirm(true);
    setShowModal(false);
  };

  const confirmDelete = async () => {
    if (!userToDelete?.id) return;
    setDeleteError(null);
    try {
      await adminApi.delete(`/admin/users/${userToDelete.id}`);
      setNotification({
        type: 'success',
        message: 'User deleted successfully.',
      });
      await loadUsers();
      await loadStats();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err?.message || err);
      setDeleteError(err?.message || 'Failed to delete user. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
    setDeleteError(null);
  };

  const handleEditUser = (user) => {
    // Fetch full user details
    adminApi
      .get(`/admin/users/${user.id}`)
      .then(({ data }) => {
        setFormData({
          email: data.email || '',
          password: '', // Don't pre-fill password
          role: data.role || 'USER',
          anonymousMode: data.anonymousMode || false,
        });
        setFormErrors({});
        setSelectedUser(data);
        setShowEditModal(true);
        setShowModal(false);
      })
      .catch((err) => {
        console.error('Failed to load user details:', err);
        setNotification({
          type: 'error',
          message: 'Failed to load user details.',
        });
      });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      if (showEditModal && selectedUser?.id) {
        // Update existing user
        const updatePayload = {
          email: formData.email.trim(),
          role: formData.role,
          anonymousMode: formData.anonymousMode,
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        await adminApi.put(`/admin/users/${selectedUser.id}`, updatePayload);
        setNotification({
          type: 'success',
          message: 'User updated successfully.',
        });
        setShowEditModal(false);
        await loadUsers();
        await loadStats();
        setFormData({
          email: '',
          password: '',
          role: 'USER',
          anonymousMode: false,
        });
      }
    } catch (err) {
      console.error('Failed to save user:', err?.message || err);
      setNotification({
        type: 'error',
        message:
          err?.response?.data?.message || err?.message || 'Failed to save user. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const tableColumns = [
    { key: 'email', label: 'Email' },
    { key: 'createdAt', label: 'Joined' },
    { key: 'status', label: 'Status' },
    { key: 'flags', label: 'Crisis Flags' },
    { key: 'actions', label: 'Actions' },
  ];

  const displayData = users.map((user) => ({
    ...user,
    email: user.email || user.userId || 'Unknown',
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
    status: user.status || 'active',
    flags: user.crisisFlags || 0,
    actions: (
      <div className="admin-user-actions">
        <Button
          variant="ghost"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleEditUser(user);
          }}
          className="admin-user-action-btn"
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteUser(user);
          }}
          className="admin-user-action-btn"
        >
          Delete
        </Button>
      </div>
    ),
  }));

  const getBadgeType = (status) => {
    const normalized = (status || 'active').toLowerCase();
    switch (normalized) {
      case 'active':
        return 'success';
      case 'banned':
        return 'danger';
      case 'inactive':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="admin-user-management-page">
      <div className="admin-user-management-header">
        <h1 className="admin-user-management-title">User Management</h1>
        <p className="admin-user-management-subtitle">Manage and monitor all platform users</p>
      </div>

      {notification && (
        <div
          className={`admin-settings-notification admin-settings-notification-${notification.type}`}
          style={{ marginBottom: 'var(--spacing-xl)' }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
            className="admin-settings-notification-close"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
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

      {/* Users Table */}
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
          <div className="admin-user-filters">
            <Input
              placeholder="Search by email..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
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
              style={{ minWidth: '150px' }}
            />
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
        <div style={{ padding: 'var(--spacing-lg)' }}>
          <Table
            columns={tableColumns}
            data={displayData}
            loading={loading}
            onRowClick={handleUserClick}
            sortable={true}
            empty="No users found"
          />
        </div>
        <div style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
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
            <Button
              variant="ghost"
              onClick={() => selectedUser?.id && handleEditUser(selectedUser)}
              disabled={!selectedUser?.id}
            >
              Edit
            </Button>
            <Button
              variant={selectedUser?.status === 'banned' ? 'primary' : 'danger'}
              onClick={() => selectedUser?.id && handleBanUser(selectedUser)}
              disabled={!selectedUser?.id}
            >
              {selectedUser?.status === 'banned' ? 'Unban' : 'Ban'} User
            </Button>
            <Button
              variant="danger"
              onClick={() => selectedUser?.id && handleDeleteUser(selectedUser)}
              disabled={!selectedUser?.id}
            >
              Delete
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="admin-user-detail-grid">
            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Email</div>
              <div className="admin-user-detail-value">{selectedUser.email || 'N/A'}</div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Status</div>
              <div className="admin-user-detail-value">
                <Badge type={getBadgeType(selectedUser?.status)}>
                  {selectedUser.status || 'active'}
                </Badge>
              </div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">User ID</div>
              <div className="admin-user-detail-value admin-user-detail-value-monospace">
                {selectedUser.id || selectedUser.userId || 'N/A'}
              </div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Joined</div>
              <div className="admin-user-detail-value">
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Crisis Flags</div>
              <div className="admin-user-detail-value">{selectedUser.crisisFlags || 0}</div>
            </div>

            <div className="admin-user-detail-item">
              <div className="admin-user-detail-label">Last Active</div>
              <div className="admin-user-detail-value">
                {selectedUser.lastActive
                  ? new Date(selectedUser.lastActive).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        title="Edit User"
        onClose={() => setShowEditModal(false)}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              helper="Leave blank to keep current password"
            />
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}
              >
                Role
              </label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'USER', label: 'User' },
                  { value: 'ADMIN', label: 'Admin' },
                ]}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.anonymousMode}
                  onChange={(e) => setFormData({ ...formData, anonymousMode: e.target.checked })}
                />
                <span>Anonymous Mode</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Ban/Unban Confirmation Modal */}
      <Modal
        isOpen={showBanConfirm}
        title={userToBan?.status === 'banned' ? 'Unban User' : 'Ban User'}
        onClose={cancelBan}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={cancelBan}>
              Cancel
            </Button>
            <Button
              variant={userToBan?.status === 'banned' ? 'primary' : 'danger'}
              onClick={confirmBan}
              disabled={!userToBan?.id}
            >
              Confirm {userToBan?.status === 'banned' ? 'Unban' : 'Ban'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {banError && (
            <div
              style={{
                padding: 'var(--spacing-sm)',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {banError}
            </div>
          )}
          <p>
            {userToBan?.status === 'banned'
              ? `Are you sure you want to unban ${userToBan?.email || 'this user'}? They will regain access to the platform.`
              : `${userToBan?.email || 'This user'} will be banned and may require review to restore access. This action can be reversed.`}
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        title="Delete User"
        onClose={cancelDelete}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={!userToDelete?.id}>
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {deleteError && (
            <div
              style={{
                padding: 'var(--spacing-sm)',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {deleteError}
            </div>
          )}
          <p>
            Are you sure you want to delete <strong>{userToDelete?.email || 'this user'}</strong>?
            This action will anonymize the user account and cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
