import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Shared form for both login and registration. `mode` controls the labels
// and which auth action runs.
export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/'); // back home once authenticated
    } catch (err) {
      setError(err.message);
    } finally {
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            required
          />
        </label>

        {error && <p className="status status--error">{error}</p>}

        <button className="search__button" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}
        </button>
      </form>

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
