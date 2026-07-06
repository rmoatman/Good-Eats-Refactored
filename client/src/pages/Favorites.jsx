// Favorites — lists the logged-in user's saved recipes, each with a link out
// to the source recipe and a remove button. Requires auth; prompts to log in otherwise.
//
// This page is purely a view over shared context: auth state comes from
// AuthContext and the saved-recipe list (plus mutations) from FavoritesContext,
// which owns the API calls and keeps the list in sync across the app.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';

export default function Favorites() {
  const { user } = useAuth();                       // null when logged out
  const { favorites, removeFavorite } = useFavorites(); // saved recipes + remove action

  // Not logged in — prompt to sign in.
  if (!user) {
    return (
      <section className="main">
        <h2 className="results__header">Favorites</h2>
        <p className="status">
          Please <Link to="/login">log in</Link> to view your saved recipes.
        </p>
      </section>
    );
  }

  return (
    <section className="main">
      <h2 className="results__header">Your Favorite Recipes</h2>

      {favorites.length === 0 ? (
        <p className="status">
          No favorites yet. Find a recipe and tap “Save to Favorites”.
        </p>
      ) : (
        <ul className="recipe-list">
          {favorites.map((f) => (
            // Keyed by recipeId (the saved recipe's stable id), reused below as
            // the target for removeFavorite.
            <li key={f.recipeId} className="recipe-card">
              {/* Reuses the RecipeCard visual styling, but the "--static"
                  variant makes it a non-clickable display card (no modal here). */}
              <div className="recipe-card__button recipe-card__button--static">
                {f.image && (
                  <img className="recipe-card__image" src={f.image} alt={f.label} />
                )}
                <span className="recipe-card__body">
                  <span className="recipe-card__title">{f.label}</span>
                  {f.url && (
                    <a
                      className="recipe-card__link"
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View recipe
                    </a>
                  )}
                </span>
              </div>
              <button
                className="fav-remove"
                onClick={() => removeFavorite(f.recipeId)}
                aria-label={`Remove ${f.label} from favorites`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
