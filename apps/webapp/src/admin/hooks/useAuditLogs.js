import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../adminApi';
import { toCSV } from '../../utils/export';

const defaultFilters = { email: '', action: '', from: '', to: '' };

export default function useAuditLogs({ initialPageSize = 25 } = {}) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (filters.email) params.set('email', filters.email);
    if (filters.action) params.set('actionType', filters.action);
    if (filters.from) {
      const fromDate = new Date(filters.from);
      if (!isNaN(fromDate.getTime())) params.set('from', fromDate.toISOString());
    }
    if (filters.to) {
      const toDate = new Date(filters.to);
      if (!isNaN(toDate.getTime())) params.set('to', toDate.toISOString());
    }
    return params.toString();
  }, [filters, page, size]);

  const qsNoEmail = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (filters.action) params.set('actionType', filters.action);
    if (filters.from) {
      const fromDate = new Date(filters.from);
      if (!isNaN(fromDate.getTime())) params.set('from', fromDate.toISOString());
    }
    if (filters.to) {
      const toDate = new Date(filters.to);
      if (!isNaN(toDate.getTime())) params.set('to', toDate.toISOString());
    }
    return params.toString();
  }, [filters.action, filters.from, filters.to, page, size]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (filters.email) {
        const body = {
          page,
          size,
          email: filters.email,
          actionType: filters.action || undefined,
          from:
            filters.from && !isNaN(new Date(filters.from)) ? new Date(filters.from).toISOString() : undefined,
          to: filters.to && !isNaN(new Date(filters.to)) ? new Date(filters.to).toISOString() : undefined,
        };
        try {
          ({ data } = await api.post('/admin/audit-logs/search', body));
          setNotice('');
        } catch (err) {
          if (err?.response?.status === 404 || err?.response?.status === 405) {
            setNotice(
              'Email filter could not be applied (server does not support POST search). Showing results without email filter.'
            );
            ({ data } = await api.get(`/admin/audit-logs?${qsNoEmail}`));
          } else {
            throw err;
          }
        }
      } else {
        ({ data } = await api.get(`/admin/audit-logs?${qs}`));
        setNotice('');
      }

      const rowsData = data?.data ?? data?.content ?? [];
      const totalPagesValue =
        data?.totalPages ??
        (typeof data?.last === 'boolean' ? (data.last ? page + 1 : page + 2) : page + 1);

      setRows(rowsData);
      setTotalPages(Math.max(1, totalPagesValue));
    } catch (err) {
      console.error('Audit logs load failed:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, page, qs, qsNoEmail, size]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const updateFilters = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(0);
  }, []);

  const setPageSize = useCallback((nextSize) => {
    setSize(nextSize);
    setPage(0);
  }, []);

  const exportCSV = useCallback(() => {
    toCSV(rows, 'audit-logs.csv', [
      { key: 'userId', title: 'User ID' },
      { key: 'actionType', title: 'Action' },
      { key: 'details', title: 'Details' },
      { key: 'createdAt', title: 'When' },
    ]);
  }, [rows]);

  return {
    rows,
    page,
    setPage,
    size,
    setPageSize,
    totalPages,
    filters,
    updateFilters,
    clearFilters,
    loading,
    error,
    notice,
    exportCSV,
  };
}

