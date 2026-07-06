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

// Allow the Vite dev server (and later the deployed client) to call this API.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, health checks) that send no Origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
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
