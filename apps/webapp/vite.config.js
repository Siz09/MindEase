import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        runtimeCaching: [
          // 🧘 Mindfulness exercises and animations
          {
            urlPattern: /^https?:\/\/localhost:8080\/api\/mindfulness\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mindfulness-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 }, // 7 days
            },
          },
          // 📓 Journal history (GET only)
          {
            urlPattern: /^https?:\/\/localhost:8080\/api\/journal\/history.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'journal-history-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 }, // 24 hours
            },
          },
          // 🎵 Audio files and animations
          {
            urlPattern: /^https?:\/\/localhost:8080\/media\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
            },
          },
          // Static assets (JS, CSS, JSON, icons)
          {
            urlPattern: ({ request }) =>
              request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'image' ||
              request.url.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
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
        global: 'globalThis', // 👈 inject global polyfill
      },
    },
  },
});
