import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function useJournalEntries({ pageSize = 10, enabled = true } = {}) {
  const { t } = useTranslation();

  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  const fetchJournalEntries = useCallback(
    async (page = 0) => {
      try {
        setIsLoading(true);
        const res = await api.get(`/journal/history?page=${page}&size=${pageSize}`);
        const data = res.data || {};
        if (data.success) {
          setEntries(data.entries || []);
          setCurrentPage(data.currentPage || 0);
          setTotalPages(data.totalPages || 0);
          setTotalEntries(data.totalEntries || data.totalElements || data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        toast.error(t('journal.errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, t]
  );

  useEffect(() => {
    if (!enabled) return;
    fetchJournalEntries(0);
  }, [enabled, fetchJournalEntries]);

  const goToPage = useCallback(
    (page) => {
      if (!enabled) return;
      if (page < 0 || page >= totalPages) return;
      fetchJournalEntries(page);
    },
    [enabled, fetchJournalEntries, totalPages]
  );

  const prependEntry = useCallback((entry) => {
    if (!entry) return;
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const upsertEntry = useCallback((updatedEntry) => {
    if (!updatedEntry?.id) return;
    setEntries((prev) => {
      const idx = prev.findIndex((it) => it.id === updatedEntry.id);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = updatedEntry;
      return next;
    });
  }, []);

  return {
    entries,
    setEntries,
    isLoading,
    currentPage,
    totalPages,
    totalEntries,
    fetchJournalEntries,
    goToPage,
    prependEntry,
    upsertEntry,
  };
}

