import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Mindfulness.css';
import MindfulnessAnalytics from '../components/mindfulness/MindfulnessAnalytics';
import FavoritesSection from '../components/mindfulness/FavoritesSection';
import SessionHistory from '../components/mindfulness/SessionHistory';
import MindfulnessDashboard from '../components/mindfulness/MindfulnessDashboard';
import BreathingSection from '../components/mindfulness/BreathingSection';
import MeditationSection from '../components/mindfulness/MeditationSection';
import ProgramsSection from '../components/mindfulness/ProgramsSection';

const Mindfulness = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('discover');

  return (
    <div className="mindfulness-container">
      <div className="mindfulness-header">
        <h1>{t('mindfulness.title')}</h1>
        <p className="mindfulness-subtitle">{t('mindfulness.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="mindfulness-tabs">
        <button
          className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          {t('mindfulness.tabs.discover', 'Discover')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
          onClick={() => setActiveTab('journey')}
        >
          {t('mindfulness.tabs.journey', 'My Journey')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          {t('mindfulness.tabs.tools', 'Guided Tools')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          {t('mindfulness.tabs.favorites', 'Favorites')}
        </button>
      </div>

      {activeTab === 'discover' && <MindfulnessDashboard />}

      {activeTab === 'journey' && (
        <>
          <MindfulnessAnalytics />
          <SessionHistory />
        </>
      )}

      {activeTab === 'tools' && (
        <div className="guided-tools-section">
          <div className="tools-grid">
            <BreathingSection />
            <MeditationSection />
          </div>
          <div className="exercises-section">
            <ProgramsSection />
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <FavoritesSection
          onSessionSelect={(session) => {
            // Handle session selection from favorites
            console.log('Selected favorite session:', session);
          }}
        />
      )}
    </div>
  );
};

export default Mindfulness;
