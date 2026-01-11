import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from '../adminApi';

export default function useUsers({ page, pageSize, filters }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    inactive: 0,
  });

  const isMountedRef = useRef(true);
  const controllerRef = useRef(null);
  const statsControllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
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

      const url = `/admin/users?${params.toString()}`;
      console.log('🌐 useUsers: Making request to:', url);
      console.log('🌐 useUsers: Request params:', { page, pageSize, filters });

      const response = await adminApi.get(url, {
        signal: controller.signal,
      });

      const { data } = response;

      // Backend returns Spring Page: { content: [...], totalElements: N, totalPages: M }
      const usersData = Array.isArray(data?.content) ? data.content : [];
      const totalPagesValue = data?.totalPages ?? 0;
      const totalElementsValue = data?.totalElements ?? 0;

      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !controller.signal.aborted) {
        console.log('✅ useUsers: Setting data', {
          usersCount: usersData.length,
          totalPages: totalPagesValue,
          totalUsers: totalElementsValue,
        });

        setUsers(usersData);
        setTotalPages(totalPagesValue);
        setTotalUsers(totalElementsValue);
      }
    } catch (err) {
      // Ignore canceled/aborted requests
      if (
        err?.name === 'AbortError' ||
        err?.name === 'CanceledError' ||
        err?.isCanceled ||
        err?.code === 'ERR_CANCELED' ||
        err?.message === 'canceled'
      ) {
        console.log('⚠️ useUsers: Request canceled (this is normal)');
        // Don't update state for canceled requests, just return
        // The finally block will handle setting loading to false
        return;
      }
      console.error('❌ useUsers: Request failed!', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        code: err?.code,
      });
      if (!isMountedRef.current) return;
      setError(err?.message || 'Failed to load users');
      setUsers([]);
      setTotalPages(0);
      setTotalUsers(0);
    } finally {
      // Always set loading to false, even if component unmounted
      // This prevents loading from getting stuck
      if (isMountedRef.current) {
        setLoading(false);
        console.log('✅ useUsers: Loading set to false');
      } else {
        // Component unmounted - still set loading to false to prevent stuck state
        // This is safe because if component unmounted, state updates are ignored anyway
        setLoading(false);
        console.log(
          '⚠️ useUsers: Component unmounted, but setting loading to false to prevent stuck state'
        );
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

      // Backend returns: { total: N, active: N, banned: N, inactive: N }
      setStats({
        total: data?.total ?? 0,
        active: data?.active ?? 0,
        banned: data?.banned ?? 0,
        inactive: data?.inactive ?? 0,
      });
    } catch (err) {
      // Ignore canceled/aborted requests
      if (
        err?.name === 'AbortError' ||
        err?.name === 'CanceledError' ||
        err?.isCanceled ||
        err?.code === 'ERR_CANCELED' ||
        err?.message === 'canceled'
      ) {
        return;
      }
      console.error('❌ useUsers: Stats failed!', err);
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
