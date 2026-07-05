import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During dev, proxy /api calls to the Express server so the browser talks to
// the same origin and we avoid CORS entirely. In production the client uses
// VITE_API_URL instead (see src/api/client.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
