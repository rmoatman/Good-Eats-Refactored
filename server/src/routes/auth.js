// Authentication routes: register/login (bcrypt hashing + JWT issuance),
// the /me lookup for the current user, and account deletion. Login avoids
// user enumeration by returning one generic error for bad email or password.
import { Router } from 'express';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { emailConfigured, sendPasswordResetEmail } from '../utils/mailer.js';

const router = Router();

// Lightweight shape check only ("x@y.z"); real validity is confirmed by use,
// not by regex. Kept simple on purpose to avoid rejecting valid addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register  { email, password }
router.post('/register', async (req, res, next) => {
  try {
    // Normalize to lowercase so lookups/uniqueness are case-insensitive;
    // coerce to strings to guard against non-string JSON payloads.
    const email = (req.body.email || '').toString().trim().toLowerCase();
    const password = (req.body.password || '').toString();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Register intentionally DOES reveal whether an email is taken (409) — a
    // signup form has to tell the user, and the email's uniqueness is already
    // observable by trying to register. Login/forgot-password stay generic.
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const user = new User({ email });
    await user.setPassword(password); // hashes with bcrypt; plaintext never stored
    await user.save();

    // Auto-login on register: hand back a token so the client is signed in.
    // toSafeJSON() strips the password hash from the response.
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
    // Same 401 + message whether the email is unknown or the password is wrong,
    // so an attacker can't probe which emails have accounts (no user
    // enumeration). verifyPassword runs bcrypt's constant-time-ish compare.
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

// POST /api/auth/forgot-password  { email }
// Emails a one-time reset link. Always responds the same way whether or not the
// account exists, to avoid revealing which emails are registered.
router.post('/forgot-password', async (req, res, next) => {
  try {
    // Reset depends on email; if it isn't configured, fail the same for everyone
    // (this doesn't reveal whether any particular account exists).
    if (!emailConfigured) {
      return res
        .status(503)
        .json({ error: 'Password reset is unavailable — email is not configured on the server.' });
    }

    const email = (req.body.email || '').toString().trim().toLowerCase();
    const genericMsg = 'If an account exists for that email, a password reset link has been sent.';

    if (EMAIL_RE.test(email)) {
      const user = await User.findOne({ email });
      if (user) {
        // setResetToken() generates a random token, stores only its HASH (plus
        // an expiry) on the user, and returns the RAW token for the email link.
        // Storing just the hash means a DB leak can't be used to reset passwords
        // — the same reason we hash passwords rather than store them.
        const rawToken = user.setResetToken();
        await user.save();
        // In production on Render, RENDER_EXTERNAL_URL is the app's own URL; in
        // dev, default to the Vite client. Override with APP_BASE_URL if needed.
        const baseUrl =
          process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
        const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
        try {
          await sendPasswordResetEmail(user.email, resetUrl);
        } catch (mailErr) {
          // Don't leak details to the client; the generic message still returns.
          console.error('[forgot-password] failed to send email:', mailErr.message);
        }
      }
    }

    return res.json({ message: genericMsg });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password  { token, password }
// Validates the emailed token (by hash + expiry) and sets a new password.
router.post('/reset-password', async (req, res, next) => {
  try {
    const token = (req.body.token || '').toString();
    const password = (req.body.password || '').toString();

    if (!token) return res.status(400).json({ error: 'Missing reset token.' });
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Look up by the hash of the presented token (we never stored the raw one)
    // AND require the expiry to still be in the future. Both conditions must
    // match a single user, so an expired or forged token finds nothing.
    const user = await User.findOne({
      resetTokenHash: User.hashResetToken(token),
      resetTokenExpires: { $gt: new Date() }, // not expired
    });
    if (!user) {
      return res
        .status(400)
        .json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    await user.setPassword(password);
    // Clear the token so the link can't be replayed to reset the password again
    // (single-use); the new password takes effect on save.
    user.clearResetToken(); // single-use
    await user.save();

    return res.json({ message: 'Your password has been reset. You can now log in.' });
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
