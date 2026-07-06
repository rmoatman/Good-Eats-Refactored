import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Privacy page (/privacy): plain-language summary of what data Good Eats stores
// and how it's protected. A logged-in user can also permanently delete their
// account and all of their data from here. Linked from the site footer; uses the
// shared .info-* content-page styles so its title matches About and Install.
export default function Privacy() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false); // disables the button while the request is in flight

  // Permanently delete the logged-in user's account, after an explicit confirm.
  // deleteAccount() also clears the local session, so we just redirect home after.
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
      // Leave the button re-enabled so the user can retry.
      setError(err.message || 'Sorry — we could not delete your account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <main className="info-page">
      {/* Page title block — eyebrow + headline + lead, same pattern as About/Install */}
      <p className="info-eyebrow">Privacy &amp; Security</p>
      <h1>Your data, and your choices.</h1>

      <p className="info-lead">
        Good Eats collects only what it needs to run, never sells your data, and
        lets you delete everything whenever you like.
      </p>

      <p className="info-section-label">What we store</p>
      <p>
        If you create an account, we store your email address, a securely hashed
        password (we never store your password in plain text), and the data you
        create in the app — your saved favorites and shopping list. That's it.
      </p>

      <p className="info-section-label">How your account is protected</p>
      <p>
        Passwords are hashed before they're saved. Signed-in requests are
        authorized with a token, and shopping-list and favorites data are only
        accessible to your own account.
      </p>

      <p className="info-section-label">Third-party services</p>
      <p>
        Recipe results come from a third-party recipe API and restaurant results
        from a location service. Your search terms are sent to those providers to
        return results. We don't sell your data or share it for advertising.
      </p>

      <p className="info-section-label">Your data &amp; choices</p>
      <p>
        You can remove favorites and clear your shopping list at any time. You can
        also permanently delete your account and all of your data whenever you like.
      </p>

      {/* Account deletion is only offered to logged-in users. */}
      {user ? (
        <>
          {/* Disabled while the request is in flight to prevent a double-submit;
              label reflects that pending state. Errors render just below it. */}
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
    </main>
  );
}
