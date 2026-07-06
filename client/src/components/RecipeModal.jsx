import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useShoppingList } from '../context/ShoppingListContext.jsx';
import { getRecipeDetails } from '../api/client.js';
import KitchenClosed from './KitchenClosed.jsx';

// Detail popup for a recipe. To save API points, the search payload only carries
// id/label/image, so the full details (ingredients, steps, cuisine, source) are
// fetched here when the modal opens — one API call per opened recipe. React
// escapes all text, so there's no XSS risk from recipe names or ingredient lines.
export default function RecipeModal({ recipe, onClose }) {
  const { user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { addRecipe } = useShoppingList();
  const [addedToList, setAddedToList] = useState(false);
  const [details, setDetails] = useState(null); // full data from GET /:id
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null); // { message, code }

  // Close on Escape for accessibility.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Fetch the recipe's full details when it opens (one API call per recipe).
  useEffect(() => {
    if (!recipe?.id) return;
    let cancelled = false;
    setDetails(null);
    setLoadError(null);
    setLoading(true);
    getRecipeDetails(recipe.id)
      .then((d) => {
        if (!cancelled) setDetails(d);
      })
      .catch((err) => {
        // e.g. QUOTA_EXCEEDED — surface the warm notice below.
        if (!cancelled) setLoadError({ message: err.message, code: err.code });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipe?.id]);

  if (!recipe) return null;

  // Title-case lowercase meal types / cuisines from the API for display.
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const joinCap = (arr) => (arr && arr.length ? arr.map(titleCase).join(', ') : '');
  const join = (arr) => (arr && arr.length ? arr.join(', ') : '');

  const saved = isFavorite(recipe.id);
  const url = details?.url || '';
  const ingredients = details?.ingredients || [];
  const instructions = details?.instructions || [];
  const ready = !!details && !loading; // details available for the action buttons

  async function toggleFavorite() {
    if (saved) {
      await removeFavorite(recipe.id);
    } else {
      await addFavorite({
        recipeId: recipe.id,
        label: recipe.label,
        image: recipe.image,
        url, // from the loaded details
      });
    }
  }

  async function addIngredientsToList() {
    if (!ingredients.length) return;
    await addRecipe(recipe.label, ingredients);
    setAddedToList(true);
    setTimeout(() => setAddedToList(false), 2500); // brief confirmation
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        {/* Title + image come from the search payload, so they render instantly */}
        <h2 className="modal__title">{recipe.label}</h2>
        {recipe.image && <img className="modal__image" src={recipe.image} alt={recipe.label} />}

        {/* Details area: loading spinner / warm quota notice / error / content */}
        {loading ? (
          <p className="status">Loading recipe…</p>
        ) : loadError ? (
          loadError.code === 'QUOTA_EXCEEDED' ? (
            <KitchenClosed message={loadError.message} />
          ) : (
            <p className="status status--error">{loadError.message}</p>
          )
        ) : (
          details && (
            <>
              {details.mealType?.length > 0 && (
                <p><strong>Meal type:</strong> {joinCap(details.mealType)}</p>
              )}
              {details.cuisineType?.length > 0 && (
                <p><strong>Cuisine:</strong> {joinCap(details.cuisineType)}</p>
              )}
              {details.dietLabels?.length > 0 && (
                <p><strong>Diet:</strong> {join(details.dietLabels)}</p>
              )}

              <h3>Ingredients</h3>
              {ingredients.length > 0 ? (
                <ul className="modal__ingredients">
                  {ingredients.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="modal__hint">No ingredient list available for this recipe.</p>
              )}

              <h3>Instructions</h3>
              {instructions.length > 0 ? (
                <ol className="modal__instructions">
                  {instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="modal__hint">
                  Step-by-step instructions aren’t available for this recipe — use “View full recipe” below.
                </p>
              )}
            </>
          )
        )}

        <div className="modal__actions">
          {url && (
            <a className="modal__link" href={url} target="_blank" rel="noreferrer">
              View full recipe
            </a>
          )}
          {user ? (
            <>
              {/* Saving needs the loaded url; allow un-saving even before details load */}
              <button
                className={`fav-button ${saved ? 'fav-button--saved' : ''}`}
                onClick={toggleFavorite}
                disabled={!ready && !saved}
              >
                {saved ? '★ Saved' : '☆ Save to Favorites'}
              </button>
              <button
                className="fav-button"
                onClick={addIngredientsToList}
                disabled={!ready || ingredients.length === 0}
              >
                {addedToList ? '✓ Added to list' : '＋ Add ingredients to list'}
              </button>
            </>
          ) : (
            <span className="modal__hint">Log in to save favorites & build a shopping list</span>
          )}
        </div>

        {/* Source attribution — required by Spoonacular's terms of use. */}
        {details?.source && (
          <p className="modal__source">
            Recipe by{' '}
            {url ? (
              <a href={url} target="_blank" rel="noreferrer">{details.source}</a>
            ) : (
              details.source
            )}
          </p>
        )}
      </div>
    </div>
  );
}
