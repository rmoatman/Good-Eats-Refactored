// Favorites — lists the logged-in user's saved recipes. Clicking a card opens
// the same RecipeModal used on the home page, so favorites get the full detail
// view (ingredients, steps) and the in-app Print button. Requires auth.
//
// This page is a view over shared context: auth state comes from AuthContext and
// the saved-recipe list (plus mutations) from FavoritesContext, which owns the
// API calls and keeps the list in sync across the app.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import RecipeModal from '../components/RecipeModal.jsx';

export default function Favorites() {
  const { user } = useAuth();                       // null when logged out
  const { favorites, removeFavorite } = useFavorites(); // saved recipes + remove action
  // The recipe whose modal is open (null = closed). We hand the modal the id so
  // it can fetch full details; label/image/url render instantly from the favorite.
  const [activeRecipe, setActiveRecipe] = useState(null);

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
    <>
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
                {/* Clicking the card opens the modal. We pass the stored fields as
                    the recipe's id/label/image/url; the modal fetches the rest. */}
                <button
                  className="recipe-card__button"
                  onClick={() =>
                    setActiveRecipe({ id: f.recipeId, label: f.label, image: f.image, url: f.url })
                  }
                >
                  {f.image && (
                    <img className="recipe-card__image" src={f.image} alt={f.label} />
                  )}
                  <span className="recipe-card__body">
                    <span className="recipe-card__title">{f.label}</span>
                    <span className="recipe-card__meta">View, print &amp; more</span>
                  </span>
                </button>
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

      {/* Same detail popup as the home page — includes the Print button. */}
      {activeRecipe && (
        <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
      )}
    </>
  );
}
