import { useCallback, useEffect, useState } from 'react';
import adminApi from '../adminApi';

export default function useUsers({ page, pageSize, filters }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    inactive: 0,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        size: pageSize,
      });
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

      const { data } = await adminApi.get(`/admin/users?${params.toString()}`);

      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalUsers(data.totalElements || data.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err?.message || err);
      setUsers([]);
      setTotalPages(0);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [filters?.search, filters?.status, page, pageSize]);

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
  }, [loadUsers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([loadUsers(), loadStats()]);
  }, [loadStats, loadUsers]);

  const getUserDetails = useCallback(async (userId) => {
    const { data } = await adminApi.get(`/admin/users/${userId}`);
    return data;
  }, []);

  const updateUser = useCallback(async (userId, payload) => {
    await adminApi.put(`/admin/users/${userId}`, payload);
  }, []);

  const deleteUser = useCallback(async (userId) => {
    await adminApi.delete(`/admin/users/${userId}`);
  }, []);

  return {
    users,
    loading,
    totalPages,
    totalUsers,
    stats,
    loadUsers,
    loadStats,
    refreshAll,
    getUserDetails,
    updateUser,
    deleteUser,
  };
}

