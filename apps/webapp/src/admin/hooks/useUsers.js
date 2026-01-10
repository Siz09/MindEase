import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from '../adminApi';

export default function useUsers({ page, pageSize, filters }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
  });

  const isMountedRef = useRef(true);
  const controllerRef = useRef(null);
  const statsControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort?.();
      statsControllerRef.current?.abort?.();
    };
  }, []);

  const loadUsers = useCallback(async () => {
    controllerRef.current?.abort?.();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        size: pageSize,
      });
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

      const { data } = await adminApi.get(`/admin/users?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!isMountedRef.current || controller.signal.aborted) return;
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalUsers(data.totalElements || data.total || 0);
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
      if (!isMountedRef.current) return;
      setError(err?.message || 'Failed to load users');
      setUsers([]);
      setTotalPages(0);
      setTotalUsers(0);
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [filters?.search, filters?.status, page, pageSize]);

  const loadStats = useCallback(async () => {
    try {
      statsControllerRef.current?.abort?.();
      const controller = new AbortController();
      statsControllerRef.current = controller;
      const { data } = await adminApi.get('/admin/users/stats', {
        signal: controller.signal,
      });

      if (!isMountedRef.current || controller.signal.aborted) return;
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        banned: data.banned || 0,
        inactive: data.inactive || 0,
      });
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
      // Failed to load stats
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

  const updateUser = useCallback(
    async (userId, payload) => {
      await adminApi.put(`/admin/users/${userId}`, payload);
      await refreshAll();
    },
    [refreshAll]
  );

  const deleteUser = useCallback(
    async (userId) => {
      await adminApi.delete(`/admin/users/${userId}`);
      await refreshAll();
    },
    [refreshAll]
  );

  return {
    users,
    loading,
    totalPages,
    totalUsers,
    stats,
    updateUser,
    deleteUser,
    refresh: loadUsers,
    refreshAll,
    getUserDetails,
    error,
  };
}
