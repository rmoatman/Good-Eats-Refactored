import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// During dev, proxy /api calls to the Express server so the browser talks to
// the same origin and we avoid CORS entirely. In production the client uses
// VITE_API_URL instead (see src/api/client.js).
export default defineConfig({
  plugins: [
    react(),
    // Makes Good Eats an installable PWA: generates the web manifest + a
    // Workbox service worker that precaches the app shell (so it loads
    // offline) and auto-updates when a new build is deployed.
    VitePWA({
      registerType: 'autoUpdate',
      // Non-hashed static files to copy into the build and precache.
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Good Eats',
        short_name: 'Good Eats',
        description: 'Find recipes for every diet, save favorites, and build a shopping list.',
        theme_color: '#0d93d1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // Maskable variant has safe-zone padding so Android can crop it to
          // any shape without clipping the artwork.
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // SPA: serve index.html for navigations so client-side routes work
        // offline, but never intercept API calls.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      // Keep the service worker off during `npm run dev` to avoid stale-cache
      // confusion while developing; it's active in production builds.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
