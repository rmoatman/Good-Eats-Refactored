// Express app entry point: configures CORS + JSON parsing, mounts the API
// routers, defines a JSON error handler, then connects to Mongo before listening.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import recipesRouter from './routes/recipes.js';
import authRouter from './routes/auth.js';
import favoritesRouter from './routes/favorites.js';
import restaurantsRouter from './routes/restaurants.js';
import shoppingListRouter from './routes/shopping-list.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Extra origins allowed to call the API (comma-separated). Defaults to the Vite
// dev server; add others (e.g. a separately-hosted client) via CLIENT_ORIGIN.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// CORS allows a request when: (1) it has no Origin (curl, health checks);
// (2) it's SAME-ORIGIN — the Origin's host matches this request's Host. This is
// essential for the production monolith, where this server also serves the
// client, so browsers attach the site's own Origin to POSTs (login/register);
// or (3) the Origin is explicitly allow-listed via CLIENT_ORIGIN.
app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');
    let sameOrigin = false;
    if (origin) {
      try {
        sameOrigin = new URL(origin).host === req.get('host');
      } catch {
        sameOrigin = false;
      }
    }
    const ok = !origin || sameOrigin || allowedOrigins.includes(origin);
    callback(ok ? null : new Error(`Origin ${origin} not allowed by CORS`), { origin: ok });
  })
);
app.use(express.json());

// Health check — handy for Render and for confirming the server is up.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/shopping-list', shoppingListRouter);

// In production we serve the built React client from this same server (a single
// Render web service), so the browser talks to one origin — no CORS, no
// separate VITE_API_URL. In dev, Vite serves the client and proxies /api here.
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html so client-side routes
  // (e.g. /favorites, /about) work on refresh/direct-load.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next(); // let unknown /api 404
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Fallback error handler so thrown errors return JSON, not HTML.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Connect to Mongo first, then start listening.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Good Eats API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
