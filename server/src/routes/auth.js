import { Router } from 'express';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register  { email, password }
router.post('/register', async (req, res, next) => {
  try {
    const email = (req.body.email || '').toString().trim().toLowerCase();
    const password = (req.body.password || '').toString();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const user = new User({ email });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body.email || '').toString().trim().toLowerCase();
    const password = (req.body.password || '').toString();

    const user = await User.findOne({ email });
    // Same message whether the email or password is wrong (no user enumeration).
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  — returns the current user (requires token)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/account — permanently delete the current user and all of
// their data. Favorites and the shopping list are embedded on the User
// document, so removing it removes everything.
router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.userId);
    if (!deleted) return res.status(404).json({ error: 'User not found.' });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
