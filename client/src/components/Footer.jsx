import { Link } from 'react-router-dom';

const REPO_URL = 'https://github.com/rmoatman/Good-Eats-Refactored';
const CONTACT_EMAIL = 'raemarie.oatman@gmail.com';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links">
          <Link to="/about">About</Link>
          <Link to="/install">Install App</Link>
          <Link to="/privacy">Privacy &amp; Security</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>Email</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
        </div>

        <div className="site-footer__copy">© {new Date().getFullYear()} Good Eats</div>
      </div>
    </footer>
  );
}
