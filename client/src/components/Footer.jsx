import { Link } from 'react-router-dom';

// The original Good Eats team. This started as a class project (Project 1)
// and is being refactored into a living app; we credit contributors by their
// GitHub profiles rather than email.
const TEAM = [
  { name: 'Tyler Wheeler', github: 'https://github.com/twheeler92' },
  { name: 'Raemarie Oatman', github: 'https://github.com/rmoatman' },
  { name: 'Celina Lind', github: 'https://github.com/clind3' },
  { name: 'Nicholas Herold', github: 'https://github.com/Nicholas-Herold' },
];

const REPO_URL = 'https://github.com/rmoatman/Good-Eats';
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

        <p className="site-footer__team-title">Original Team</p>
        <ul className="site-footer__team">
          {TEAM.map((m) => (
            <li key={m.github}>
              <a href={m.github} target="_blank" rel="noreferrer">{m.name}</a>
            </li>
          ))}
        </ul>

        <div className="site-footer__copy">
          Good Eats — a class project being refactored into a living app.
          <br />© {new Date().getFullYear()} Good Eats
        </div>
      </div>
    </footer>
  );
}
