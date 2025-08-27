import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './i18n';
import '../sentry.client.config';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
