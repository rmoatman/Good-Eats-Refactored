// The original Good Eats team. This started as a class project (Project 1) and
// is being refactored into a living app; we credit contributors by GitHub
// profile rather than email.
const TEAM = [
  { name: 'Tyler Wheeler', github: 'https://github.com/twheeler92' },
  { name: 'Raemarie Oatman', github: 'https://github.com/rmoatman' },
  { name: 'Celina Lind', github: 'https://github.com/clind3' },
  { name: 'Nicholas Herold', github: 'https://github.com/Nicholas-Herold' },
];

export default function About() {
  return (
    <section className="main info-page">
      <h2 className="results__header">About Good Eats</h2>
      <p>
        Good Eats began as a class project. The motivation came from a family
        member with many dietary restrictions who struggled to find recipes that
        fit her needs. We built Good Eats as an easy resource for anyone to find
        meals that match the criteria they provide — searching by ingredient and
        filtering by dietary restriction — and to discover restaurants nearby.
      </p>
      <p>
        The original team learned to work with web APIs (for recipes and
        restaurants), GitHub branching and forking, and a new styling framework.
        The app is now being refactored into a living project: a React + Vite
        front end with an Express and MongoDB back end, user accounts, saved
        favorites, and a shareable shopping list.
      </p>
      <h3>Original Team</h3>
      <ul className="about-team">
        {TEAM.map((m) => (
          <li key={m.github}>
            <a href={m.github} target="_blank" rel="noreferrer">{m.name}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
