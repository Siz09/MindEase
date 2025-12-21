'use client';

import { useTranslation } from 'react-i18next';
import MoodCharts from '../components/MoodCharts';
import MoodWellnessTips from '../components/MoodWellnessTips';
import InsightsDailySummariesCard from '../components/InsightsDailySummariesCard';
import InsightsJournalEntriesCard from '../components/InsightsJournalEntriesCard';
import InsightsStatsCard from '../components/InsightsStatsCard';
import useJournalInsights from '../hooks/useJournalInsights';
import useMoodInsights from '../hooks/useMoodInsights';
import '../styles/Insights.css';

const Insights = () => {
  const { t, i18n } = useTranslation();
  const { moodHistory, isLoading, stats } = useMoodInsights({ pageSize: 100 });
  const {
    journalStats,
    journalEntries,
    dailySummaries,
    journalPage,
    setJournalPage,
    entriesPerPage,
    totalPages,
    summaryLoading,
  } = useJournalInsights({ entriesPerPage: 4 });

  return (
    <div className="page insights-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('insights.title') || 'Insights'}</h1>
          <p className="page-subtitle">
            {t('insights.subtitle') || 'Your mood and journal insights at a glance'}
          </p>
        </div>

        <div className="insights-content">
          <InsightsStatsCard journalStats={journalStats} moodStats={stats} />

          <section className="insights-section">
            <MoodCharts moodHistory={moodHistory} isLoading={isLoading} />
          </section>

          <section className="insights-section insights-summaries-container">
            <InsightsDailySummariesCard
              dailySummaries={dailySummaries}
              summaryLoading={summaryLoading}
              language={i18n.language}
            />

            <InsightsJournalEntriesCard
              journalEntries={journalEntries}
              summaryLoading={summaryLoading}
              journalPage={journalPage}
              setJournalPage={setJournalPage}
              entriesPerPage={entriesPerPage}
              totalPages={totalPages}
              language={i18n.language}
            />
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
            <MoodWellnessTips />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Insights;
