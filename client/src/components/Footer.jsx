// Persistent site footer rendered by App below every routed page. Holds the
// in-app info links (routed via <Link>) plus external contact/source links, and
// an auto-updating copyright line.
import { Link } from 'react-router-dom';

// Hoisted out of the component so these constants aren't re-created each render,
// and so the contact/repo targets live in one obvious place to update.
const REPO_URL = 'https://github.com/rmoatman/Good-Eats-Refactored';
const CONTACT_EMAIL = 'raemarie.oatman@gmail.com';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links">
          {/* Internal routes use <Link> for client-side navigation (no full reload) */}
          <Link to="/about">About</Link>
          <Link to="/install">Install App</Link>
          <Link to="/privacy">Privacy &amp; Security</Link>
          {/* External destinations use plain <a>: mailto opens the user's mail client, */}
          {/* and the repo opens in a new tab with rel="noreferrer" for tab-nabbing safety */}
          <a href={`mailto:${CONTACT_EMAIL}`}>Email</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
        </div>

        {/* Year is computed at render time so the copyright never goes stale */}
        <div className="site-footer__copy">© {new Date().getFullYear()} Good Eats</div>
      </div>
    </footer>
  );
}
