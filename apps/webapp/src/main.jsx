import '../sentry.client.config'; // must be first import
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './i18n';
import '../sentry.client.config';

import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

// workspace sanity check
import { placeholder } from '@mindease/ui';
console.log('UI link:', placeholder); // expect: ui-ready

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
