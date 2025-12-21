'use client';

import { useEffect, useState } from 'react';
import useUserFilters from '../hooks/useUserFilters';
import useUsers from '../hooks/useUsers';
import UserModals from '../components/users/UserModals';
import UserNotification from '../components/users/UserNotification';
import UserStats from '../components/users/UserStats';
import UserTable from '../components/users/UserTable';
import '../../styles/admin-user-management.css';

export default function UserManagement() {
  const { page, setPage, pageSize, filters, handleSearch, handleStatusFilter, clearFilters } =
    useUserFilters();
  const {
    users,
    loading,
    totalPages,
    totalUsers,
    stats,
    refreshAll,
    getUserDetails,
    updateUser,
    deleteUser,
  } = useUsers({ page, pageSize, filters });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [banError, setBanError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'USER',
    anonymousMode: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleBanUser = (user) => {
    if (!user?.id) return;
    setUserToBan(user);
    setShowBanConfirm(true);
    setShowDetailsModal(false);
  };

  const confirmBan = async () => {
    if (!userToBan?.id) return;
    setBanError(null);
    try {
      const status = userToBan.status === 'banned' ? 'active' : 'banned';
      await updateUser(userToBan.id, { status });
      setNotification({
        type: 'success',
        message: `User ${status === 'banned' ? 'banned' : 'unbanned'} successfully.`,
      });
      await refreshAll();
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
    setShowDetailsModal(false);
  };

  const confirmDelete = async () => {
    if (!userToDelete?.id) return;
    setDeleteError(null);
    try {
      await deleteUser(userToDelete.id);
      setNotification({
        type: 'success',
        message: 'User deleted successfully.',
      });
      await refreshAll();
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

  const handleEditUser = async (user) => {
    if (!user?.id) return;
    try {
      const data = await getUserDetails(user.id);
      setFormData({
        email: data.email || '',
        password: '',
        role: data.role || 'USER',
        anonymousMode: data.anonymousMode || false,
      });
      setFormErrors({});
      setSelectedUser(data);
      setShowEditModal(true);
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setNotification({
        type: 'error',
        message: 'Failed to load user details.',
      });
    }
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
    e?.preventDefault?.();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      if (showEditModal && selectedUser?.id) {
        const updatePayload = {
          email: formData.email.trim(),
          role: formData.role,
          anonymousMode: formData.anonymousMode,
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        await updateUser(selectedUser.id, updatePayload);
        setNotification({
          type: 'success',
          message: 'User updated successfully.',
        });
        setShowEditModal(false);
        await refreshAll();
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

  return (
    <div className="admin-user-management-page">
      <div className="admin-user-management-header">
        <h1 className="admin-user-management-title">User Management</h1>
        <p className="admin-user-management-subtitle">Manage and monitor all platform users</p>
      </div>

      <UserNotification notification={notification} onDismiss={() => setNotification(null)} />

      {/* Stats Cards */}
      <UserStats stats={stats} />

      {/* Users Table */}
      <UserTable
        users={users}
        loading={loading}
        totalUsers={totalUsers}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={filters}
        onSearch={handleSearch}
        onStatusChange={handleStatusFilter}
        onClearFilters={clearFilters}
        onUserClick={handleUserClick}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      <UserModals
        selectedUser={selectedUser}
        showDetailsModal={showDetailsModal}
        onCloseDetailsModal={() => setShowDetailsModal(false)}
        onEditUser={handleEditUser}
        onBanUser={handleBanUser}
        onDeleteUser={handleDeleteUser}
        showEditModal={showEditModal}
        onCloseEditModal={() => {
          setShowEditModal(false);
          setFormErrors({});
        }}
        formData={formData}
        formErrors={formErrors}
        formLoading={formLoading}
        onChangeFormData={setFormData}
        onSubmitForm={handleSubmit}
        showBanConfirm={showBanConfirm}
        userToBan={userToBan}
        banError={banError}
        onCancelBan={cancelBan}
        onConfirmBan={confirmBan}
        showDeleteConfirm={showDeleteConfirm}
        userToDelete={userToDelete}
        deleteError={deleteError}
        onCancelDelete={cancelDelete}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
}
