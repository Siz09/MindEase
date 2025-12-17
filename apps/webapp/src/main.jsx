import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Use original global styles (pre-Tailwind design system)
import './styles/index.css';
// Import Tailwind CSS for Chat component
import './styles/globals.css';
import './i18n';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
