import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import MoodInput from '../components/MoodInput';
import JournalForm from '../components/JournalForm';
import JournalHistory from '../components/JournalHistory';
import '../styles/CheckIn.css';
import '../styles/EmojiPicker.css';

const CheckIn = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  // Mood state
  const [moodLoading, setMoodLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState(null);

  // Journal state
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [journalSubmitting, setJournalSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch journal entries
  const fetchJournalEntries = useCallback(
    async (page = 0) => {
      try {
        setJournalLoading(true);
        const res = await api.get(`/journal/history?page=${page}&size=10`);
        const data = res.data || {};
        if (data.success) {
          setJournalEntries(data.entries || []);
          setCurrentPage(data.currentPage || 0);
          setTotalPages(data.totalPages || 0);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        toast.error(t('journal.errors.fetchFailed'));
      } finally {
        setJournalLoading(false);
      }
    },
    [t]
  );

  // Initial load
  useEffect(() => {
    if (!token) return;
    fetchJournalEntries(0);
  }, [token, fetchJournalEntries]);

  const handleMoodSubmit = async (moodData) => {
    try {
      setMoodLoading(true);
      const response = await api.post('/mood/add', {
        moodValue: moodData.value,
        notes: moodData.notes || null,
      });
      if (response.data.status === 'success' || response.data.success) {
        toast.success(t('mood.success.saved') || 'Mood entry saved!');
        // Update shared current mood for cross-component sync
        setCurrentMood({
          value: moodData.value,
          emoji: moodData.emoji,
          label: moodData.label,
        });
      }
    } catch (error) {
      console.error('Failed to save mood:', error);
      toast.error(t('mood.errors.saveFailed') || 'Failed to save mood entry');
    } finally {
      setMoodLoading(false);
    }
  };

  const handleJournalSubmit = async (content) => {
    try {
      setJournalSubmitting(true);
      const res = await api.post('/journal/add', { content });
      const data = res.data || {};

      if (data.success || data.status === 'success') {
        toast.success(t('journal.success.added') || 'Journal entry added!');
        await fetchJournalEntries(0);
        setCurrentPage(0);
      } else {
        toast.error(t('journal.errors.saveFailed') || 'Failed to save journal entry');
      }
    } catch (err) {
      console.error('Error saving journal entry:', err);
      toast.error(t('journal.errors.saveFailed') || 'Error saving journal entry');
    } finally {
      setJournalSubmitting(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchJournalEntries(newPage);
    }
  };

  return (
    <div className="page check-in-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('checkin.title') || 'Check-in'}</h1>
          <p className="page-subtitle">
            {t('checkin.subtitle') || 'How are you feeling today? Share your mood and thoughts.'}
          </p>
        </div>

        <div className="check-in-content">
          {/* Mood Input Section */}
          <section className="check-in-section">
            <MoodInput onSubmit={handleMoodSubmit} loading={moodLoading} />
          </section>

          {/* Journal Form Section */}
          <section className="check-in-section">
            <JournalForm
              onSubmit={handleJournalSubmit}
              loading={journalSubmitting}
              isOffline={isOffline}
              currentMood={currentMood}
              onUpdateMood={setCurrentMood}
            />
          </section>

          {/* Journal History Section */}
          <section className="check-in-section">
            <JournalHistory
              entries={journalEntries}
              isLoading={journalLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
