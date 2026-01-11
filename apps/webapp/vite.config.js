import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const enablePwaInDev = env.VITE_PWA_DEV === 'true';

  return {
    server: {
      port: 5174,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // PWA caching is useful for offline testing, but it makes UI/CSS iteration confusing.
        // Keep it OFF in dev by default; enable with `VITE_PWA_DEV=true`.
        devOptions: { enabled: enablePwaInDev },
        workbox: {
          // Disable navigation routing - let React Router handle all navigation
          navigateFallback: null,
          // runtimeCaching rules
          runtimeCaching: [
            {
              // Admin API requests - always go to network, never cache
              urlPattern: /\/api\/admin\/.*/,
              handler: 'NetworkOnly',
              options: {
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Journal history (user entries) - network first, fallback to cache
              urlPattern: /\/api\/journal\/history/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'journal-history-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Lottie animation JSONs served from backend (cache first for faster playback offline)
              urlPattern: /\/media\/animations\/.*\.json/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'animations-cache',
                expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Audio files - cache first (so streamed audio can work offline once cached)
              urlPattern: /\/media\/audio\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'audio-cache',
                expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Static assets (icons, fonts) - cache first
              urlPattern: /\/(icons|assets|static)\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-assets-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 24 * 60 * 60 }, // 60 days
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // All other API requests - always go to network, never cache
              // This ensures API requests bypass service worker when no specific rule matches
              urlPattern: /\/api\/.*/,
              handler: 'NetworkOnly',
              options: {
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          name: 'MindEase Web',
          short_name: 'MindEase',
          description: 'Mental wellness web app. Private and bilingual.',
          start_url: '.',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0ea5e9',
          icons: [
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
  };
});
