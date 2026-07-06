import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/client.js';

// /forgot-password — request a reset link by email. The server always responds
// the same way whether or not the account exists (no account enumeration), so
// we just show a "check your email" confirmation on success.
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | sent | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message || 'If an account exists for that email, a reset link has been sent.');
      setStatus('sent');
    } catch (err) {
      setMessage(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="auth">
      <h2 className="auth__title">Forgot your password?</h2>

      {status === 'sent' ? (
        <>
          <p className="status">{message}</p>
          <p className="status">Check your inbox for the reset link — it expires in 1 hour.</p>
          <p className="auth__switch"><Link to="/login">Back to log in</Link></p>
        </>
      ) : (
        <>
          <p className="status">Enter your email and we'll send you a link to reset your password.</p>
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

            {status === 'error' && <p className="status status--error">{message}</p>}

            <button className="search__button" type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="auth__switch"><Link to="/login">Back to log in</Link></p>
        </>
      )}
    </div>
  );
}
