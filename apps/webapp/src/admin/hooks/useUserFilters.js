import { useCallback, useState } from 'react';

const DEFAULT_PAGE_SIZE = 10;

export default function useUserFilters({ initialPageSize = DEFAULT_PAGE_SIZE } = {}) {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });

  const handleSearch = useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(0);
  }, []);

  const handleStatusFilter = useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all' });
    setPage(0);
  }, []);

  return {
    page,
    setPage,
    pageSize,
    filters,
    setFilters,
    handleSearch,
    handleStatusFilter,
    clearFilters,
  };
}

