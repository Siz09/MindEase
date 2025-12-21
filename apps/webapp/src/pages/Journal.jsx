'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import JournalEntryComposer from '../components/JournalEntryComposer';
import JournalHistory from '../components/JournalHistory';
import useAICompletionPolling from '../hooks/useAICompletionPolling';
import useJournalAIStatus from '../hooks/useJournalAIStatus';
import useJournalEntries from '../hooks/useJournalEntries';
import '../styles/Journal.css';

const Journal = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const enabled = Boolean(token);
  const { entries, isLoading, currentPage, totalPages, totalEntries, goToPage, prependEntry, upsertEntry } =
    useJournalEntries({ pageSize: 10, enabled });
  const { aiStatus, isOffline } = useJournalAIStatus({ enabled });

  const [submitting, setSubmitting] = useState(false);

  const pollForAICompletion = useAICompletionPolling((updatedEntry) => {
    upsertEntry(updatedEntry);
  });

  const handleSubmitEntry = async ({ title, content, moodValue }) => {
    if (!enabled) return;

    setSubmitting(true);
    try {
      const res = await api.post('/journal/add', {
        title: title ?? null,
        content,
        moodValue: moodValue ?? null,
      });
      const data = res.data || {};
      const returnedEntry = data.entry || null;

      toast.success('Journal entry added!');

      if (returnedEntry) {
        prependEntry(returnedEntry);
      }

      if (returnedEntry?.id) {
        pollForAICompletion(returnedEntry.id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="journal-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('journal.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-container">
      <div className="journal-header">
        <h1>{t('journal.title')}</h1>
        <p className="journal-subtitle">{t('journal.subtitle')}</p>
        <div className={`ai-status ${aiStatus.available ? 'available' : 'unavailable'}`}>
          <span className="ai-dot"></span>
          {aiStatus.available ? t('journal.aiAvailable') : t('journal.aiUnavailable')}
        </div>
      </div>

      <div className="journal-layout">
        <JournalEntryComposer
          onSubmit={handleSubmitEntry}
          loading={submitting}
          aiAvailable={aiStatus.available}
          isOffline={isOffline}
        />

        <JournalHistory
          entries={entries}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalEntries={totalEntries || entries.length}
          onPageChange={goToPage}
          showAISections={true}
        />
      </div>
    </div>
  );
};

export default Journal;
