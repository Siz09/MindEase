import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WebSocketTester, PerformanceMonitor } from '../utils/websocketTest';
import { toast } from 'react-toastify';

const WebSocketTestComponent = () => {
  const { token, currentUser } = useAuth();
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  const runTests = async () => {
    if (!token || !currentUser) {
      toast.error('Please log in to run WebSocket tests');
      return;
    }

    setIsRunning(true);
    setTestResults(null);
    setPerformanceMetrics(null);

    try {
      // Check browser compatibility first
      const browserCheck = WebSocketTester.checkBrowserCompatibility();
      if (!browserCheck.isCompatible) {
        toast.error('Browser compatibility issues detected');
        return;
      }

      // Run WebSocket tests
      const tester = new WebSocketTester();
      const monitor = new PerformanceMonitor();
      
      monitor.startConnectionTimer();
      const results = await tester.runTests(token, currentUser.id);
      monitor.endConnectionTimer();
      
      setTestResults(results);
      setPerformanceMetrics(monitor.getMetrics());

      if (results.connection && results.authentication && results.messaging) {
        toast.success('All WebSocket tests passed! 🎉');
      } else {
        toast.warning('Some WebSocket tests failed. Check results below.');
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      toast.error('Test execution failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    return status ? '✅' : '❌';
  };

  const getStatusColor = (status) => {
    return status ? '#16a34a' : '#dc2626';
  };

  return (
    <div className="websocket-tester" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">WebSocket Compatibility Tester</h2>
          <p className="card-description">
            Test WebSocket functionality across different browsers and devices
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={runTests} 
            disabled={isRunning || !token}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {isRunning ? 'Running Tests...' : 'Run WebSocket Tests'}
          </button>
        </div>

        {testResults && (
          <div className="test-results">
            <h3>Test Results</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Connection Test:</span>
                <span style={{ color: getStatusColor(testResults.connection) }}>
                  {getStatusIcon(testResults.connection)} {testResults.connection ? 'Passed' : 'Failed'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Authentication Test:</span>
                <span style={{ color: getStatusColor(testResults.authentication) }}>
                  {getStatusIcon(testResults.authentication)} {testResults.authentication ? 'Passed' : 'Failed'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Messaging Test:</span>
                <span style={{ color: getStatusColor(testResults.messaging) }}>
                  {getStatusIcon(testResults.messaging)} {testResults.messaging ? 'Passed' : 'Failed'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Reconnection Test:</span>
                <span style={{ color: getStatusColor(testResults.reconnection) }}>
                  {getStatusIcon(testResults.reconnection)} {testResults.reconnection ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {testResults.errors.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#dc2626' }}>Errors:</h4>
                <ul style={{ color: '#dc2626', fontSize: '14px' }}>
                  {testResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {performanceMetrics && (
          <div className="performance-metrics" style={{ marginTop: '20px' }}>
            <h3>Performance Metrics</h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
              <div>Connection Time: {performanceMetrics.connectionTime.toFixed(2)}ms</div>
              <div>Average Message Latency: {performanceMetrics.averageLatency.toFixed(2)}ms</div>
              <div>Messages Sent: {performanceMetrics.messageLatency.length}</div>
              <div>Reconnection Count: {performanceMetrics.reconnectionCount}</div>
              <div>Error Count: {performanceMetrics.errorCount}</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
          <p><strong>Browser Info:</strong></p>
          <p>User Agent: {navigator.userAgent}</p>
          <p>WebSocket Support: {typeof WebSocket !== 'undefined' ? 'Yes' : 'No'}</p>
          <p>Local Storage: {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default WebSocketTestComponent;