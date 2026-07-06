// AuthForm — one component that renders BOTH the login and the registration
// screens. The router mounts it at /login with mode="login" and at /register
// with mode="register"; everything that differs between the two (labels, button
// text, password rules, which auth action fires) is derived from that prop.
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Shared form for both login and registration. `mode` controls the labels
// and which auth action runs.
export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'; // single flag every mode-dependent branch reads from
  const { login, register } = useAuth();  // both actions call the API and update AuthContext on success
  const navigate = useNavigate();

  // Controlled-input state for the two fields, plus UI state for errors and
  // the in-flight submit (used to disable the button and avoid double submits).
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();     // keep the SPA; don't let the form do a page reload
    setError('');           // clear any stale error from a previous attempt
    setSubmitting(true);
    try {
      // Fire the matching auth action; both throw on failure (bad creds,
      // email already taken, etc.), which is caught below and shown inline.
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/'); // back home once authenticated
    } catch (err) {
      setError(err.message);
    } finally {
      // Always re-enable the button, whether we navigated away or errored.
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <h2 className="auth__title">{isRegister ? 'Create an account' : 'Log in'}</h2>
      <form className="auth__form" onSubmit={handleSubmit}>
        <label className="auth__field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="auth__field">
          Password
          {/* Registration hints the browser to offer a new saved password and
              enforces an 8-char minimum; login uses the current-password hint
              and no minimum (old accounts may predate the rule). */}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            required
          />
        </label>

        {/* Inline server/validation error, only rendered when one is set. */}
        {error && <p className="status status--error">{error}</p>}

        <button className="search__button" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}
        </button>
      </form>

      {/* Password-reset link only makes sense on the login screen. */}
      {!isRegister && (
        <p className="auth__switch">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      )}

      {/* Cross-link to the opposite mode so users can switch login <-> register. */}
      <p className="auth__switch">
        {isRegister ? (
          <>Already have an account? <Link to="/login">Log in</Link></>
        ) : (
          <>Need an account? <Link to="/register">Sign up</Link></>
        )}
      </p>
    </div>
  );
}
