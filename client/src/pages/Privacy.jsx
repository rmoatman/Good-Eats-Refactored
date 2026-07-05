import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Privacy() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Permanently delete the logged-in user's account after a confirmation.
  async function handleDelete() {
    const ok = window.confirm(
      'This permanently deletes your account and all of your data (favorites and shopping list). This cannot be undone. Are you sure?'
    );
    if (!ok) return;
    setError('');
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/'); // back home, now logged out
    } catch (err) {
      setError(err.message || 'Sorry — we could not delete your account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <section className="main info-page">
      <h2 className="results__header">Privacy &amp; Security</h2>

      <h3>What we store</h3>
      <p>
        If you create an account, we store your email address, a securely hashed
        password (we never store your password in plain text), and the data you
        create in the app — your saved favorites and shopping list. That's it.
      </p>

      <h3>How your account is protected</h3>
      <p>
        Passwords are hashed before they're saved. Signed-in requests are
        authorized with a token, and shopping-list and favorites data are only
        accessible to your own account.
      </p>

      <h3>Third-party services</h3>
      <p>
        Recipe results come from a third-party recipe API and restaurant results
        from a location service. Your search terms are sent to those providers to
        return results. We don't sell your data or share it for advertising.
      </p>

      <h3>Your data & choices</h3>
      <p>
        You can remove favorites and clear your shopping list at any time. You can
        also permanently delete your account and all of your data whenever you like.
      </p>

      {user ? (
        <>
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete My Account'}
          </button>
          {error && <p className="status status--error">{error}</p>}
        </>
      ) : (
        <p className="status">Log in to delete your account.</p>
      )}
    </section>
  );
}
