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
// Render (and most PaaS hosts) inject the port to bind via process.env.PORT;
// 5000 is only the local-dev fallback.
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
// Passing a FUNCTION (not a static options object) to cors() makes this a
// per-request "delegate": cors calls it with (req, callback) on every request
// and we decide dynamically whether that request's Origin is allowed.
app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');
    let sameOrigin = false;
    if (origin) {
      try {
        // Compare only hosts (scheme is ignored). If the Origin header can't be
        // parsed as a URL, treat it as untrusted rather than throwing.
        sameOrigin = new URL(origin).host === req.get('host');
      } catch {
        sameOrigin = false;
      }
    }
    const ok = !origin || sameOrigin || allowedOrigins.includes(origin);
    // Delegate signature: callback(err, options). Reflecting `origin: ok` back
    // (true) tells cors to echo the request Origin in Access-Control-Allow-Origin;
    // on failure we pass an Error so the middleware rejects the request.
    callback(ok ? null : new Error(`Origin ${origin} not allowed by CORS`), { origin: ok });
  })
);
// Parse JSON request bodies into req.body for all routes below.
app.use(express.json());

// Health check — handy for Render and for confirming the server is up.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Feature routers, each namespaced under /api/*. The path prefix here is
// stripped before the router sees the request (so routes inside are relative).
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/shopping-list', shoppingListRouter);

// In production we serve the built React client from this same server (a single
// Render web service), so the browser talks to one origin — no CORS, no
// separate VITE_API_URL. In dev, Vite serves the client and proxies /api here.
// Registered AFTER the API routers so real /api requests are handled first and
// only unmatched paths fall through to the static assets / SPA fallback below.
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

// Fallback error handler so thrown errors return JSON, not HTML. Express
// recognizes this as an error handler ONLY because it declares 4 args
// (err, req, res, next) — the `next` param is required for that signature even
// though it's unused. Must be registered LAST so it catches errors from any
// route/middleware above (including the CORS rejection Error).
app.use((err, req, res, next) => {
  console.error(err);
  // Honor an explicit err.status if a handler set one; otherwise 500.
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Connect to Mongo FIRST, then start listening — so we never accept requests
// against a DB we can't reach. If the connection fails, log and exit non-zero
// so the host (Render) treats the deploy as failed and can restart it, rather
// than leaving a half-broken server up.
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
