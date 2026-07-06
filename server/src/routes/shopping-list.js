// CRUD (plus an "email me my list" action) for the current user's shopping
// list. Like favorites, the list is an embedded array on the User document
// rather than its own collection, so every operation loads the user, mutates
// user.shoppingList, and saves. Items are Mongoose subdocuments (each has an
// _id and a `checked` flag), which is why toggling/removing can address items
// by their _id. All routes require auth (see router.use below).
import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendShoppingListEmail } from '../utils/mailer.js';

const router = Router();
router.use(requireAuth); // all shopping-list routes require a logged-in user

// Group flat items into [{ recipeLabel, items: [text,...] }] preserving order.
// Used only for the emailed version so the message reads recipe-by-recipe. The
// Map tracks each label's position in `groups` so items keep first-seen order
// and repeated labels merge into the same group instead of creating duplicates.
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

    // Skip non-strings and blank entries so junk from the client can't create
    // empty rows; store the trimmed text tagged with which recipe it came from.
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
    // .id() is Mongoose's subdocument lookup by _id — scoped to THIS user's
    // array, so one user can never toggle another user's item. Flip in place.
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
    // Filter out the target by _id; compare the stringified ObjectId to the
    // string route param. Only write if something was actually removed, so
    // deleting a missing/foreign id is a harmless no-op with no DB round-trip.
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
    // Always email the account's own address (never a client-supplied one), so
    // this endpoint can't be abused to send mail to arbitrary recipients.
    await sendShoppingListEmail(user.email, groupByRecipe(user.shoppingList));
    res.json({ sent: true, to: user.email });
  } catch (err) {
    // This handler answers directly instead of calling next(err): a missing
    // mail configuration is an expected 503 ("Service Unavailable"), while
    // anything else is a genuine 500. The 503 hint is detected by message text.
    res.status(err.message?.includes('not configured') ? 503 : 500).json({
      error: err.message || 'Failed to send email.',
    });
  }
});

export default router;
