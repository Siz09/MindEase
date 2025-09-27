import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WebSocketTestComponent from '../components/WebSocketTester';
import '../styles/Testing.css';

const Testing = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('websocket');

  const tabs = [
    { id: 'websocket', label: 'WebSocket Tests', icon: '🔌' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'compatibility', label: 'Browser Compatibility', icon: '🌐' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'websocket':
        return <WebSocketTestComponent />;
      case 'performance':
        return <PerformanceTestComponent />;
      case 'compatibility':
        return <CompatibilityTestComponent />;
      default:
        return <WebSocketTestComponent />;
    }
  };

  return (
    <div className="page testing-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Testing Dashboard</h1>
          <p className="page-subtitle">
            Comprehensive testing tools for WebSocket functionality and performance
          </p>
        </div>

        <div className="testing-tabs">
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformanceTestComponent = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
  });

  const runPerformanceTests = () => {
    // Simulate performance metrics
    const startTime = performance.now();
    
    setTimeout(() => {
      const loadTime = performance.now() - startTime;
      const memoryUsage = performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0;
      
      setMetrics({
        loadTime: loadTime.toFixed(2),
        memoryUsage: memoryUsage.toFixed(2),
        networkLatency: Math.random() * 100 + 50, // Simulated
      });
    }, 1000);
  };

  return (
    <div className="performance-test">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Performance Metrics</h3>
        </div>
        
        <button onClick={runPerformanceTests} className="btn btn-primary">
          Run Performance Tests
        </button>

        {metrics.loadTime > 0 && (
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-value">{metrics.loadTime}ms</div>
              <div className="metric-label">Load Time</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{metrics.memoryUsage}MB</div>
              <div className="metric-label">Memory Usage</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{metrics.networkLatency.toFixed(2)}ms</div>
              <div className="metric-label">Network Latency</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CompatibilityTestComponent = () => {
  const [compatibility, setCompatibility] = useState(null);

  const checkCompatibility = () => {
    const results = {
      webSocket: typeof WebSocket !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      es6: typeof Symbol !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
    };

    setCompatibility(results);
  };

  return (
    <div className="compatibility-test">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Browser Compatibility</h3>
        </div>
        
        <button onClick={checkCompatibility} className="btn btn-primary">
          Check Compatibility
        </button>

        {compatibility && (
          <div className="compatibility-results">
            {Object.entries(compatibility).map(([feature, supported]) => (
              <div key={feature} className="compatibility-item">
                <span className="feature-name">{feature}</span>
                <span className={`support-status ${supported ? 'supported' : 'not-supported'}`}>
                  {supported ? '✅ Supported' : '❌ Not Supported'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="browser-info">
          <h4>Browser Information</h4>
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>Platform:</strong> {navigator.platform}</p>
          <p><strong>Language:</strong> {navigator.language}</p>
          <p><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default Testing;