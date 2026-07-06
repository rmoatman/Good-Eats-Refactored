// JWT auth helpers: mint tokens at login/signup and guard protected routes.
// The token carries only the user id (as `sub`) so no session state is kept
// server-side; JWT_SECRET must match between signing and verifying.
import jwt from 'jsonwebtoken';

// Sign a JWT for a user id. Token is sent to the client and stored there.
export function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Express middleware: require a valid Bearer token, attach req.userId.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
