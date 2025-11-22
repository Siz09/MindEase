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

const Dashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  // Widget State
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved
      ? JSON.parse(saved)
      : {
          mood: true,
          journal: true,
          history: true,
        };
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  const toggleWidget = (key) => {
    const newWidgets = { ...widgets, [key]: !widgets[key] };
    setWidgets(newWidgets);
    localStorage.setItem('dashboard_widgets', JSON.stringify(newWidgets));
  };

  const showMoodReplyToast = (moodData) => {
    if (!moodData) return;
    toast.dismiss('mood-reply-toast');
    toast(
      <div className="reply-toast">
        <div className="reply-toast-emoji">{moodData.emoji || '🙂'}</div>
        <div className="reply-toast-body">
          <p className="reply-toast-title">{t('mood.replyToast.title')}</p>
          <p className="reply-toast-text">
            {t('mood.replyToast.message', { mood: moodData.label || t('mood.howAreYouFeeling') })}
          </p>
        </div>
      </div>,
      {
        toastId: 'mood-reply-toast',
        className: 'reply-toast-shell',
        icon: false,
        closeButton: false,
        autoClose: 3500,
      }
    );
  };

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
        showMoodReplyToast(moodData);
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

  const handleJournalSubmit = async ({ title, content }) => {
    try {
      setJournalSubmitting(true);
      const res = await api.post('/journal/add', { title, content });
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
        <div
          className="page-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <h1 className="page-title">{t('checkin.title') || 'Dashboard'}</h1>
            <p className="page-subtitle">
              {t('checkin.subtitle') || 'Your personal wellness space.'}
            </p>
          </div>
          <button className="btn btn-outline" onClick={() => setIsCustomizing(!isCustomizing)}>
            {isCustomizing ? 'Done' : 'Customize'}
          </button>
        </div>

        {isCustomizing && (
          <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 className="card-title">Customize Dashboard</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={widgets.mood}
                  onChange={() => toggleWidget('mood')}
                />
                Mood Tracker
              </label>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={widgets.journal}
                  onChange={() => toggleWidget('journal')}
                />
                Journal Entry
              </label>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={widgets.history}
                  onChange={() => toggleWidget('history')}
                />
                Recent History
              </label>
            </div>
          </div>
        )}

        <div className="check-in-content">
          {/* Mood Input Section */}
          {widgets.mood && (
            <section className="check-in-section">
              <MoodInput
                onSubmit={handleMoodSubmit}
                loading={moodLoading}
                currentMood={currentMood}
              />
            </section>
          )}

          {/* Journal Form Section */}
          {widgets.journal && (
            <section className="check-in-section">
              <JournalForm
                onSubmit={handleJournalSubmit}
                loading={journalSubmitting}
                isOffline={isOffline}
                currentMood={currentMood}
                onUpdateMood={setCurrentMood}
              />
            </section>
          )}

          {/* Journal History Section */}
          {widgets.history && (
            <section className="check-in-section">
              <JournalHistory
                entries={journalEntries}
                isLoading={journalLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
