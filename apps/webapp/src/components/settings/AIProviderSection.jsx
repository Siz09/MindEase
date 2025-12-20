import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const AIProviderSection = ({ currentUser }) => {
  const { t } = useTranslation();
  const [aiProvider, setAiProvider] = useState('OPENAI');
  const [aiProviderLoading, setAiProviderLoading] = useState(false);

  useEffect(() => {
    const fetchAIProvider = async () => {
      try {
        const response = await api.get('/chat/provider');
        setAiProvider(response.data.currentProvider || 'OPENAI');
      } catch (error) {
        console.error('Failed to fetch AI provider:', error);
        setAiProvider(null);
        toast.error(t('settings.notifications.aiProviderLoadFailed'));
      }
    };

    if (currentUser) fetchAIProvider();
  }, [currentUser, t]);

  const handleAIProviderChange = async (newProvider) => {
    setAiProviderLoading(true);
    try {
      await api.put('/chat/provider', { provider: newProvider });
      setAiProvider(newProvider);
      toast.success(t('settings.notifications.aiProviderUpdated'));
    } catch (error) {
      console.error('Failed to update AI provider:', error);
      toast.error(t('settings.notifications.aiProviderUpdateFailed'));
    } finally {
      setAiProviderLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">🤖 AI Assistant Provider</h2>
      </div>

      <div className="ai-provider-settings">
        <p className="setting-description">
          Choose which AI powers your mental health conversations. You can switch between providers
          at any time.
        </p>

        <div className="provider-options">
          <div
            className={`provider-card ${aiProvider === 'OPENAI' ? 'selected' : ''}`}
            onClick={() => !aiProviderLoading && handleAIProviderChange('OPENAI')}
            onKeyDown={(e) =>
              e.key === 'Enter' && !aiProviderLoading && handleAIProviderChange('OPENAI')
            }
            role="button"
            tabIndex={aiProviderLoading ? -1 : 0}
            aria-pressed={aiProvider === 'OPENAI'}
            aria-disabled={aiProviderLoading}
            style={{ cursor: aiProviderLoading ? 'not-allowed' : 'pointer' }}
          >
            <div className="provider-icon">⚡</div>
            <div className="provider-info">
              <h3>OpenAI (Cloud)</h3>
              <p>Fast, cloud-based responses (1-3s)</p>
              <span className="provider-badge">Recommended</span>
            </div>
            {aiProvider === 'OPENAI' && <div className="selected-indicator">✓</div>}
          </div>

          <div
            className={`provider-card ${aiProvider === 'LOCAL' ? 'selected' : ''}`}
            onClick={() => !aiProviderLoading && handleAIProviderChange('LOCAL')}
            onKeyDown={(e) =>
              e.key === 'Enter' && !aiProviderLoading && handleAIProviderChange('LOCAL')
            }
            role="button"
            tabIndex={aiProviderLoading ? -1 : 0}
            aria-pressed={aiProvider === 'LOCAL'}
            aria-disabled={aiProviderLoading}
            style={{ cursor: aiProviderLoading ? 'not-allowed' : 'pointer' }}
          >
            <div className="provider-icon">🔒</div>
            <div className="provider-info">
              <h3>MindEase AI (Local)</h3>
              <p>Private, with evidence-based citations (3-7s)</p>
              <span className="provider-badge">Privacy Focused</span>
            </div>
            {aiProvider === 'LOCAL' && <div className="selected-indicator">✓</div>}
          </div>

          <div
            className={`provider-card ${aiProvider === 'AUTO' ? 'selected' : ''}`}
            onClick={() => !aiProviderLoading && handleAIProviderChange('AUTO')}
            onKeyDown={(e) =>
              e.key === 'Enter' && !aiProviderLoading && handleAIProviderChange('AUTO')
            }
            role="button"
            tabIndex={aiProviderLoading ? -1 : 0}
            aria-pressed={aiProvider === 'AUTO'}
            aria-disabled={aiProviderLoading}
            style={{ cursor: aiProviderLoading ? 'not-allowed' : 'pointer' }}
          >
            <div className="provider-icon">🎯</div>
            <div className="provider-info">
              <h3>Auto Selection</h3>
              <p>System chooses the best option for you</p>
              <span className="provider-badge">Smart</span>
            </div>
            {aiProvider === 'AUTO' && <div className="selected-indicator">✓</div>}
          </div>
        </div>

        <div className="current-provider-info">
          <span className="info-label">Current Provider:</span>
          <span className="info-value">
            {aiProvider === 'OPENAI' && '⚡ OpenAI (Fast & Reliable)'}
            {aiProvider === 'LOCAL' && '🔒 MindEase AI (Private)'}
            {aiProvider === 'AUTO' && '🎯 Auto Selection (Smart)'}
            {aiProvider === null && '⚠️ Unable to load provider'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIProviderSection;

