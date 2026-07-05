// The original Good Eats team, credited by GitHub profile. This started as a
// class project (Project 1) and is being refactored into a living app.
const TEAM = [
  { name: 'Tyler Wheeler', gh: 'twheeler92' },
  { name: 'Raemarie Oatman', gh: 'rmoatman' },
  { name: 'Celina Lind', gh: 'clind3' },
  { name: 'Nicholas Herold', gh: 'Nicholas-Herold' },
];

export default function About() {
  return (
    <main className="info-page">
      <p className="info-eyebrow">About</p>
      <h1>From a class project to a living app.</h1>

      <p className="info-lead">
        Good Eats began as an academic project — a team of students building an easy
        way to find recipes that fit real dietary needs, save favorites, and turn
        them into a shopping list. What started as coursework became a foundation
        worth carrying forward.
      </p>

      <p className="info-section-label">Original team</p>
      <ul className="info-credits">
        {TEAM.map((m) => (
          <li key={m.gh}>
            <span className="info-credit-name">{m.name}</span>
            <a
              className="info-credit-link"
              href={`https://github.com/${m.gh}`}
              target="_blank"
              rel="noreferrer"
            >
              github.com/{m.gh}
            </a>
          </li>
        ))}
      </ul>

      <div className="info-card">
        <p>
          In <strong>July 2026</strong>, Raemarie Oatman began refactoring and
          modernizing Good Eats in collaboration with <strong>Claude Code
          (Anthropic)</strong>, evolving the app from its academic origins into a
          refined, production-ready platform.
        </p>
      </div>
    </main>
  );
}
