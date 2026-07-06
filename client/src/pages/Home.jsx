// Home — the main search page. Handles the search box, dietary filters,
// the results list (paginated client-side at PAGE_SIZE per page), and opening
// a selected recipe in the modal.
import { useEffect, useState } from 'react';
import { searchRecipes } from '../api/client.js';
import DietaryFilters from '../components/DietaryFilters.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import RecipeModal from '../components/RecipeModal.jsx';
import RestaurantFinder from '../components/RestaurantFinder.jsx';

const PAGE_SIZE = 8; // recipes shown per page

export default function Home() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [page, setPage] = useState(1);

  async function runSearch(q, health) {
    setStatus('loading');
    setError('');
    try {
      const data = await searchRecipes(q, health);
      setRecipes(data.recipes);
      setPage(1); // reset to the first page for each new search
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  // Load a default set of suggestions on first render.
  useEffect(() => {
    runSearch('', []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(query, filters);
  }

  function toggleFilter(value) {
    setFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  return (
    <>
      <section className="search-panel">
        <form className="search" onSubmit={handleSubmit}>
          <input
            className="search__input"
            type="text"
            placeholder="Search recipes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search__button" type="submit">Search</button>
        </form>
        <DietaryFilters selected={filters} onToggle={toggleFilter} />
      </section>

      <div className="home-layout">
        <section className="main">
          <h2 className="results__header">
            {query ? 'Top Results' : 'Suggested Recipes'}
          </h2>

          {status === 'loading' && <p className="status">Loading recipes…</p>}
          {status === 'error' && <p className="status status--error">{error}</p>}
          {status === 'idle' && recipes.length === 0 && (
            <p className="status">No recipes found. Try different terms.</p>
          )}

          <ul className="recipe-list">
            {/* Search returns the full result set; slice locally to the current page. */}
            {recipes
              .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
              .map((r) => (
                <RecipeCard key={r.id} recipe={r} onOpen={setActiveRecipe} />
              ))}
          </ul>

          {recipes.length > PAGE_SIZE && (
            <nav className="pagination" aria-label="Recipe pages">
              <button
                className="pagination__btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <span className="pagination__status">
                Page {page} of {Math.ceil(recipes.length / PAGE_SIZE)}
              </span>
              <button
                className="pagination__btn"
                onClick={() =>
                  setPage((p) => Math.min(Math.ceil(recipes.length / PAGE_SIZE), p + 1))
                }
                disabled={page >= Math.ceil(recipes.length / PAGE_SIZE)}
              >
                Next →
              </button>
            </nav>
          )}
        </section>

        <RestaurantFinder />
      </div>

      {activeRecipe && (
        <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
      )}
    </>
  );
}
