import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function useJournalEntries({ pageSize = 10, enabled = true } = {}) {
  const { t } = useTranslation();

  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  const isMountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort?.();
    };
  }, []);

  const fetchJournalEntries = useCallback(
    async (page = 0) => {
      if (!enabled) return;
      controllerRef.current?.abort?.();
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestSignal = controller.signal;
      try {
        setIsLoading(true);
        const res = await api.get(`/journal/history?page=${page}&size=${pageSize}`, {
          signal: requestSignal,
        });
        const data = res.data || {};
        if (data.success) {
          if (!isMountedRef.current || requestSignal.aborted) return;
          setEntries(data.entries || []);
          setCurrentPage(data.currentPage || 0);
          setTotalPages(data.totalPages || 0);
          setTotalEntries(data.totalEntries || data.totalElements || data.total || 0);
        }
      } catch (error) {
        if (error?.name === 'AbortError' || error?.name === 'CanceledError') return;
        console.error('Error fetching journal entries:', error);
        toast.error(t('journal.errors.fetchFailed'));
      } finally {
        if (isMountedRef.current && !requestSignal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [enabled, pageSize, t]
  );

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.abort?.();
      setIsLoading(false);
      return;
    }

    fetchJournalEntries(0);
    return () => controllerRef.current?.abort?.();
  }, [enabled, fetchJournalEntries]);

  const goToPage = useCallback(
    (page) => {
      if (!enabled) return;
      if (page < 0 || (totalPages > 0 && page >= totalPages)) return;
      fetchJournalEntries(page);
    },
    [enabled, fetchJournalEntries, totalPages]
  );

  const prependEntry = useCallback(
    (entry) => {
      if (!entry) return;
      setEntries((prev) => [entry, ...prev]);
      setCurrentPage(0);
      setTotalEntries((prev) => {
        const nextTotal = prev + 1;
        setTotalPages((prevPages) => Math.max(prevPages, Math.ceil(nextTotal / pageSize)));
        return nextTotal;
      });
    },
    [pageSize]
  );

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
