import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendShoppingListEmail } from '../utils/mailer.js';

const router = Router();
router.use(requireAuth); // all shopping-list routes require a logged-in user

// Group flat items into [{ recipeLabel, items: [text,...] }] preserving order.
function groupByRecipe(list) {
  const groups = [];
  const index = new Map();
  for (const item of list) {
    const key = item.recipeLabel || '';
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({ recipeLabel: key, items: [] });
    }
    groups[index.get(key)].items.push(item.text);
  }
  return groups;
}

// GET /api/shopping-list — the current user's items.
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ shoppingList: user.shoppingList });
  } catch (err) {
    next(err);
  }
});

// POST /api/shopping-list — add a recipe's ingredients.
// Body: { recipeLabel, items: ["1 cup flour", ...] }
router.post('/', async (req, res, next) => {
  try {
    const { recipeLabel = '', items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array.' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    for (const text of items) {
      if (typeof text === 'string' && text.trim()) {
        user.shoppingList.push({ text: text.trim(), recipeLabel });
      }
    }
    await user.save();
    res.status(201).json({ shoppingList: user.shoppingList });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/shopping-list/:itemId — toggle an item's checked state.
router.patch('/:itemId', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const item = user.shoppingList.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    item.checked = !item.checked;
    await user.save();
    res.json({ shoppingList: user.shoppingList });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/shopping-list/:itemId — remove one item.
router.delete('/:itemId', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const before = user.shoppingList.length;
    user.shoppingList = user.shoppingList.filter(
      (i) => i._id.toString() !== req.params.itemId
    );
    if (user.shoppingList.length !== before) await user.save();
    res.json({ shoppingList: user.shoppingList });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/shopping-list — clear the whole list.
router.delete('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.shoppingList = [];
    await user.save();
    res.json({ shoppingList: [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/shopping-list/email — email the current list to the user.
router.post('/email', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.shoppingList.length === 0) {
      return res.status(400).json({ error: 'Your shopping list is empty.' });
    }
    await sendShoppingListEmail(user.email, groupByRecipe(user.shoppingList));
    res.json({ sent: true, to: user.email });
  } catch (err) {
    // Surface a clean message if email isn't configured.
    res.status(err.message?.includes('not configured') ? 503 : 500).json({
      error: err.message || 'Failed to send email.',
    });
  }
});

export default router;
