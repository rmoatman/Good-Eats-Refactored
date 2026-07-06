import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client.js';

// /reset-password?token=... — set a new password using the token from the email
// link. The token is validated server-side (hash + expiry).
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      const res = await authApi.resetPassword(token, password);
      setMessage(res.message || 'Your password has been reset.');
      setStatus('done');
    } catch (err) {
      setMessage(err.message);
      setStatus('error');
    }
  }

  // No token in the URL — the link was malformed or opened directly.
  if (!token) {
    return (
      <div className="auth">
        <h2 className="auth__title">Reset password</h2>
        <p className="status status--error">
          This reset link is missing its token. Use the link from your email, or request a new one.
        </p>
        <p className="auth__switch"><Link to="/forgot-password">Request a new link</Link></p>
      </div>
    );
  }

  return (
    <div className="auth">
      <h2 className="auth__title">Set a new password</h2>

      {status === 'done' ? (
        <>
          <p className="status">{message}</p>
          <p className="auth__switch"><Link to="/login">Log in</Link></p>
        </>
      ) : (
        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="auth__field">
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="auth__field">
            Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {status === 'error' && <p className="status status--error">{message}</p>}

          <button className="search__button" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      )}
    </div>
  );
}
