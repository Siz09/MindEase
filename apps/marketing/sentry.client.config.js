import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // use env variable
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0, // adjust for production
});
