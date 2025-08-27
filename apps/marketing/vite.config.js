import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'your-org-slug',
      project: 'mindease-marketing',
      //   authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
