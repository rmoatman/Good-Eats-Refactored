// JWT auth helpers: mint tokens at login/signup and guard protected routes.
// The token carries only the user id (as `sub`) so no session state is kept
// server-side; JWT_SECRET must match between signing and verifying.
import jwt from 'jsonwebtoken';

// Sign a JWT for a user id. Token is sent to the client and stored there.
// `sub` (subject) is the standard JWT claim for "who this token is about" — we
// keep the payload minimal (just the id) so nothing sensitive rides in the
// token, which is only base64-encoded, not encrypted. The 7-day expiry bounds
// how long a leaked token stays valid.
export function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Express middleware: require a valid Bearer token, attach req.userId.
export function requireAuth(req, res, next) {
  // Expect an "Authorization: Bearer <token>" header; slice(7) drops "Bearer ".
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    // verify() both checks the signature (proving we minted it) AND rejects
    // expired tokens — either failure throws and lands in catch below.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Stash the user id for downstream handlers; they trust req.userId because
    // it came from a verified token, not from client-supplied body/query.
    req.userId = payload.sub;
    next();
  } catch {
    // Deliberately vague message (don't reveal whether it was invalid vs expired).
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
