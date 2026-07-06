// Home — the main search page. Handles the search box, dietary filters,
// the results list (paginated client-side at PAGE_SIZE per page), and opening
// a selected recipe in the modal.
//
// Data flow: the search form and filters feed runSearch(), which calls
// searchRecipes() (our Express backend, which in turn proxies the recipe API).
// The full result set is held in state and sliced locally for pagination — the
// server is only hit once per search, not once per page.
import { useEffect, useState } from 'react';
import { searchRecipes } from '../api/client.js';
import DietaryFilters from '../components/DietaryFilters.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import RecipeModal from '../components/RecipeModal.jsx';
import RestaurantFinder from '../components/RestaurantFinder.jsx';
import KitchenClosed from '../components/KitchenClosed.jsx';

const PAGE_SIZE = 8; // recipes shown per page

export default function Home() {
  const [query, setQuery] = useState('');       // current text in the search box
  const [filters, setFilters] = useState([]);   // selected dietary filters, e.g. ['vegan', 'gluten-free']
  const [recipes, setRecipes] = useState([]);   // full result set from the last search (all pages)
  const [status, setStatus] = useState('idle'); // idle | loading | error — drives which message/UI shows
  const [error, setError] = useState('');       // human-readable error text to display
  const [errorCode, setErrorCode] = useState(''); // machine code from the API, e.g. QUOTA_EXCEEDED
  const [activeRecipe, setActiveRecipe] = useState(null); // recipe shown in the modal, or null when closed
  const [page, setPage] = useState(1);          // 1-based current page for client-side pagination

  // Fetch recipes for a query + set of dietary filters and store the whole
  // result set. Any thrown error carries an optional `.code` (see errorCode)
  // so the UI can special-case things like a quota-exceeded response.
  async function runSearch(q, health) {
    setStatus('loading');
    setError('');
    setErrorCode('');
    try {
      const data = await searchRecipes(q, health);
      setRecipes(data.recipes);
      setPage(1); // reset to the first page for each new search
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setErrorCode(err.code || '');
      setStatus('error');
    }
  }

  // Load a default set of suggestions on first render (empty query, no filters)
  // so the page never opens blank. The eslint-disable keeps this a mount-only
  // effect: runSearch is intentionally not in the dependency list.
  useEffect(() => {
    runSearch('', []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search on form submit. preventDefault stops the browser's full-page reload
  // so we stay in the SPA and drive the update through React state instead.
  function handleSubmit(e) {
    e.preventDefault();
    runSearch(query, filters);
  }

  // Toggle a single dietary filter on/off in the selected list. Note this only
  // updates state — it does NOT re-run the search; the user must hit Search to
  // apply changed filters.
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
          {/* Header wording reflects whether this is a real search or the
              default suggestions shown on load. */}
          <h2 className="results__header">
            {query ? 'Top Results' : 'Suggested Recipes'}
          </h2>

          {/* Mutually exclusive status messages driven by `status`. */}
          {status === 'loading' && <p className="status">Loading recipes…</p>}
          {/* On a quota-exceeded error show the warm "kitchen closed" notice
              instead of a raw error line; any other error shows plain text. */}
          {status === 'error' &&
            (errorCode === 'QUOTA_EXCEEDED' ? (
              <KitchenClosed message={error} />
            ) : (
              <p className="status status--error">{error}</p>
            ))}
          {/* Empty-but-successful result (idle, no error, zero recipes). */}
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

          {/* Pagination controls only appear when there's more than one page. */}
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

      {/* Recipe detail modal: rendered only while a card is selected; closing
          it clears activeRecipe back to null. */}
      {activeRecipe && (
        <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
      )}
    </>
  );
}
