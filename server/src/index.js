import 'dotenv/config';
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
