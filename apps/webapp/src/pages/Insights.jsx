'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import MoodStats from '../components/MoodStats';
import MoodCharts from '../components/MoodCharts';
import '../styles/Insights.css';

const Insights = () => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [moodHistory, setMoodHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [journalStats, setJournalStats] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [journalPage, setJournalPage] = useState(0);
  const ENTRIES_PER_PAGE = 4;

  const fetchMoodHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/mood/history', {
        params: { page: 0, size: 100 }, // Get more entries for better analytics
      });

      if (response.data.success || response.data.status === 'success') {
        const history = response.data.data || [];
        setMoodHistory(history);

        // Compute statistics (guard invalid values)
        const validEntries = history.filter((e) => typeof e.moodValue === 'number');
        if (validEntries.length > 0) {
          const total = validEntries.reduce((sum, entry) => sum + entry.moodValue, 0);
          const average = (total / validEntries.length).toFixed(1);
          const latest = validEntries[0]?.moodValue ?? 0;
          const previous = validEntries[1]?.moodValue ?? latest;

          let trend = 'stable';
          if (latest > previous) trend = 'up';
          else if (latest < previous) trend = 'down';

          setStats({ average, total: validEntries.length, trend, latest });
        } else {
          setStats(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mood history:', error);
      toast.error('Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDailySummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const response = await api.get('/journal/history', {
        params: { page: 0, size: 100 }, // Get all entries
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

        // Stats
        const todayEntriesCount = entries.filter((e) => keyFor(e.createdAt) === todayKey).length;
        // Calculate average entries per day over the actual date range of fetched entries
        let avgEntriesPerDay = 0;
        if (totalEntries > 0) {
          const oldest = new Date(entries[entries.length - 1].createdAt);
          const daysDiff = Math.max(1, Math.ceil((today - oldest) / (1000 * 60 * 60 * 24)));
          avgEntriesPerDay = (totalEntries / daysDiff).toFixed(1);
        }
        setJournalStats({ totalEntries, todayEntries: todayEntriesCount, avgEntriesPerDay });

        // Only yesterday's combined summary (local 12am-12am)
        const dayMap = new Map();
        for (const e of entries) {
          const k = keyFor(e.createdAt);
          if (!dayMap.has(k)) dayMap.set(k, []);
          dayMap.get(k).push(e);
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
        setDailySummary(null); // do not show inside Journal Insights
      }
    } catch (error) {
      console.error('[v0] Failed to fetch journal entries:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchMoodHistory();
    fetchDailySummary();
  }, [token, fetchMoodHistory, fetchDailySummary]);

  return (
    <div className="page insights-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('insights.title') || 'Insights'}</h1>
          <p className="page-subtitle">
            {t('insights.subtitle') || 'Understand your mood patterns and track your progress.'}
          </p>
        </div>

        <div className="insights-content">
          {journalStats && (
            <section className="insights-section">
              <div className="card daily-summary-card">
                <div className="card-header">
                  <div className="summary-header-top">
                    <h3 className="card-title">
                      {t('insights.journalInsights') || 'Journal Insights'}
                    </h3>
                  </div>
                </div>

                {journalStats && (
                  <div className="journal-stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{journalStats.todayEntries}</div>
                      <div className="stat-label">
                        {t('insights.entriesToday') || 'Entries Today'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{journalStats.totalEntries}</div>
                      <div className="stat-label">
                        {t('insights.totalEntries') || 'Total Entries'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{journalStats.avgEntriesPerDay}</div>
                      <div className="stat-label">{t('insights.avgPerDay') || 'Avg Per Day'}</div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {stats && (
            <section className="insights-section">
              <MoodStats stats={stats} isLoading={isLoading} />
            </section>
          )}

          <section className="insights-section">
            <MoodCharts moodHistory={moodHistory} isLoading={isLoading} />
          </section>

          {/* AI Summaries (bottom, after charts) */}
          <section className="insights-section insights-summaries-container">
            {/* Top: Daily summaries (yesterday) */}
            <div className="card daily-summaries-section">
              <div className="card-header">
                <div className="section-header-wrapper">
                  <div className="section-icon-badge">📅</div>
                  <div>
                    <h3 className="card-title">
                      {t('insights.recentSummaries') || 'Daily Summaries'}
                    </h3>
                    <p className="section-subtitle">
                      {t('insights.yesterdayOverview') || "Yesterday's journal overview"}
                    </p>
                  </div>
                </div>
              </div>
              {summaryLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>{t('insights.generatingSummary') || 'Generating summary...'}</p>
                </div>
              ) : dailySummaries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3 className="empty-title">
                    {t('insights.noDailySummaries') || 'No daily summaries yet'}
                  </h3>
                  <p className="empty-description">
                    {t('insights.summaryProcessing') ||
                      'Add journal entries yesterday to see AI summaries here.'}
                  </p>
                </div>
              ) : (
                <div className="daily-summaries-list">
                  {dailySummaries.map((day) => (
                    <div key={day.dateKey} className="daily-summary-card">
                      <div className="daily-summary-header">
                        <div className="date-info">
                          <span className="date-label">
                            {(() => {
                              const [y, m, d] = day.dateKey.split('-').map(Number);
                              return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              });
                            })()}
                          </span>
                          {day.count && (
                            <span className="entry-count-badge">
                              {day.count} {day.count === 1 ? 'entry' : 'entries'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="daily-summary-content">
                        <div className="summary-indicator">✨</div>
                        <p className="daily-summary-text">{day.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Below: Individual journal summaries */}
            <div className="card journal-summary-section">
              <div className="card-header">
                <div className="section-header-wrapper">
                  <div className="section-icon-badge">📖</div>
                  <div>
                    <h3 className="card-title">
                      {t('journal.journalSummary') || 'Journal Summary'}
                    </h3>
                  </div>
                </div>
              </div>
              {summaryLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>{t('journal.loading') || 'Loading...'}</p>
                </div>
              ) : journalEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✍️</div>
                  <h3 className="empty-title">{t('journal.noEntries') || 'No entries yet'}</h3>
                  <p className="empty-description">
                    {t('journal.startWriting') || 'Add a journal entry to see AI insights here.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="journal-entries-grid">
                    {journalEntries
                      .slice(journalPage * ENTRIES_PER_PAGE, (journalPage + 1) * ENTRIES_PER_PAGE)
                      .map((entry, idx) => (
                        <div
                          key={
                            entry.id || `${entry.createdAt}-${(entry.content || '').slice(0, 20)}`
                          }
                          className="journal-entry-card"
                        >
                          <div className="entry-header">
                            <span className="entry-timestamp">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="entry-badge">
                              Entry #{journalPage * ENTRIES_PER_PAGE + idx + 1}
                            </span>
                          </div>

                          <div className="entry-content-wrapper">
                            {/* Original Entry */}
                            <div className="entry-original">
                              <div className="content-label">
                                <span className="label-icon">📝</span>
                                <span>{t('journal.entry') || 'Your Entry'}</span>
                              </div>
                              {entry.content ? (
                                <p className="entry-text">{entry.content}</p>
                              ) : (
                                <p className="entry-text muted">
                                  {t('journal.noContent') || 'No content'}
                                </p>
                              )}
                            </div>

                            {/* AI Summary */}
                            <div className="entry-summary">
                              <div className="content-label">
                                <span className="label-icon">✨</span>
                                <span>AI Insight</span>
                              </div>
                              {entry.aiSummary ? (
                                <p className="summary-text">{entry.aiSummary}</p>
                              ) : (
                                <p className="summary-text processing">
                                  {t('journal.aiProcessing') || 'AI is processing this entry...'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {/* Pagination controls */}
                  {journalEntries.length > ENTRIES_PER_PAGE && (
                    <div className="pagination-controls">
                      <button
                        onClick={() => setJournalPage(Math.max(0, journalPage - 1))}
                        disabled={journalPage === 0}
                        className="pagination-button"
                      >
                        ← Previous
                      </button>
                      <span className="pagination-info">
                        Page {journalPage + 1} of{' '}
                        {Math.ceil(journalEntries.length / ENTRIES_PER_PAGE)}
                      </span>
                      <button
                        onClick={() =>
                          setJournalPage(
                            Math.min(
                              Math.ceil(journalEntries.length / ENTRIES_PER_PAGE) - 1,
                              journalPage + 1
                            )
                          )
                        }
                        disabled={
                          journalPage >= Math.ceil(journalEntries.length / ENTRIES_PER_PAGE) - 1
                        }
                        className="pagination-button"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {!isLoading && moodHistory.length === 0 && (
            <section className="insights-section">
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" fill="var(--primary-green)" opacity="0.1" />
                    <path
                      d="M20 32c0-6.6 5.4-12 12-12s12 5.4 12 12-5.4 12-12 12-12-5.4-12-12z"
                      fill="var(--primary-green)"
                      opacity="0.3"
                    />
                    <path
                      d="M26 28h4M34 28h4M24 38s4 4 8 4 8-4 8-4"
                      stroke="var(--primary-green)"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                <h3 className="empty-title">{t('insights.noMoodData') || 'No mood data yet'}</h3>
                <p className="empty-description">
                  {t('insights.startTracking') ||
                    'Start tracking your mood from the Check-in page to see insights and trends.'}
                </p>
              </div>
            </section>
          )}

          <section className="insights-section">
            <div className="card tips-card">
              <div className="card-header">
                <h3 className="card-title">{t('mood.wellnessTips') || 'Wellness Tips'}</h3>
              </div>
              <div className="tips-grid">
                <div className="tip-item">
                  <div className="tip-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L3 9v9h6v-6h6v6h6V9l-9-7z" fill="var(--primary-green)" />
                    </svg>
                  </div>
                  <div className="tip-content">
                    <h4>{t('mood.tip1Title') || 'Rest & Recovery'}</h4>
                    <p>
                      {t('mood.tip1Description') || 'Get enough sleep and take breaks when needed.'}
                    </p>
                  </div>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="var(--primary-green)"
                        strokeWidth="2"
                      />
                      <path d="M8 12l2 2 4-4" stroke="var(--primary-green)" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="tip-content">
                    <h4>{t('mood.tip2Title') || 'Stay Active'}</h4>
                    <p>{t('mood.tip2Description') || 'Regular physical activity improves mood.'}</p>
                  </div>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                        stroke="var(--primary-green)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="tip-content">
                    <h4>{t('mood.tip3Title') || 'Connect'}</h4>
                    <p>
                      {t('mood.tip3Description') || 'Social connections boost overall well-being.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Insights;
