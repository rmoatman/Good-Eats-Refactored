import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Every route here requires a valid token; req.userId is set by requireAuth.
router.use(requireAuth);

// GET /api/favorites — list the current user's saved recipes (newest first).
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const favorites = [...user.favorites].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ favorites });
  } catch (err) {
    next(err);
  }
});

// POST /api/favorites — add a recipe. Body: { recipeId, label, image, url }.
// Idempotent: adding an already-saved recipe just returns the current list.
router.post('/', async (req, res, next) => {
  try {
    const { recipeId, label, image, url } = req.body || {};
    if (!recipeId || !label) {
      return res.status(400).json({ error: 'recipeId and label are required.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const already = user.favorites.some((f) => f.recipeId === recipeId);
    if (!already) {
      user.favorites.push({ recipeId, label, image, url });
      await user.save();
    }

    res.status(already ? 200 : 201).json({ favorites: user.favorites });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/favorites/:recipeId — remove a saved recipe.
router.delete('/:recipeId', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const before = user.favorites.length;
    user.favorites = user.favorites.filter((f) => f.recipeId !== req.params.recipeId);
    if (user.favorites.length !== before) await user.save();

    res.json({ favorites: user.favorites });
  } catch (err) {
    next(err);
  }
});

export default router;
