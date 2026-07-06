// About page (/about): static content page telling the app's origin story and
// crediting the original class-project team. Linked from the site footer; uses
// the shared .info-* content-page styles so its layout matches Install/Privacy.

// The original Good Eats team, credited by GitHub profile. This started as a
// class project (Project 1) and is being refactored into a living app.
// Kept as a data array so the credits list below can be rendered with a map.
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
      {/* Render one credit row per team member; keyed by GitHub handle (unique). */}
      <ul className="info-credits">
        {TEAM.map((m) => (
          <li key={m.gh}>
            <span className="info-credit-name">{m.name}</span>
            {/* Handle is interpolated into the profile URL; rel="noreferrer"
                is the safe pairing for target="_blank" external links. */}
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
