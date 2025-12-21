import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const defaultEntriesPerPage = 4;

export const stripLeadingEmoji = (content) => {
  if (!content) return '';
  const s = String(content);
  const match = s.match(
    /^(?:\p{Extended_Pictographic}(?:\u200d\p{Extended_Pictographic})*(?:\ufe0f)?)+\s?/u
  );
  return match ? s.slice(match[0].length) : s;
};

export default function useJournalInsights({ entriesPerPage = defaultEntriesPerPage } = {}) {
  const [journalStats, setJournalStats] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [journalPage, setJournalPage] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchJournalHistory = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const response = await api.get('/journal/history', {
        params: { page: 0, size: 100 },
      });

      if (response.data.success || response.data.status === 'success') {
        const entries = response.data.entries || [];
        setJournalEntries(entries);

        const totalEntries = entries.length;
        const today = new Date();
        const keyFor = (d) => {
          const dt = new Date(d);
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const todayKey = keyFor(today);

        const todayEntriesCount = entries.filter((e) => keyFor(e.createdAt) === todayKey).length;

        let avgEntriesPerDay = 0;
        if (totalEntries > 0) {
          const oldest = new Date(entries[entries.length - 1].createdAt);
          const daysDiff = Math.max(1, Math.ceil((today - oldest) / (1000 * 60 * 60 * 24)));
          avgEntriesPerDay = (totalEntries / daysDiff).toFixed(1);
        }

        setJournalStats({ totalEntries, todayEntries: todayEntriesCount, avgEntriesPerDay });

        const dayMap = new Map();
        for (const entry of entries) {
          const k = keyFor(entry.createdAt);
          if (!dayMap.has(k)) dayMap.set(k, []);
          dayMap.get(k).push(entry);
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = keyFor(yesterday);
        const yList = dayMap.get(yesterdayKey) || [];
        const ySummaries = yList.map((e) => e.aiSummary).filter(Boolean);

        if (ySummaries.length > 0) {
          setDailySummaries([
            {
              dateKey: yesterdayKey,
              summary: ySummaries.join(' \u2022 '),
              count: ySummaries.length,
            },
          ]);
        } else {
          setDailySummaries([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      setJournalEntries([]);
      setJournalStats(null);
      setDailySummaries([]);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournalHistory();
  }, [fetchJournalHistory]);

  useEffect(() => {
    setJournalPage(0);
  }, [journalEntries]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(journalEntries.length / entriesPerPage));
  }, [entriesPerPage, journalEntries.length]);

  return {
    journalStats,
    journalEntries,
    dailySummaries,
    journalPage,
    setJournalPage,
    entriesPerPage,
    totalPages,
    summaryLoading,
    refresh: fetchJournalHistory,
  };
}

