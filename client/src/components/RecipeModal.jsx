import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useShoppingList } from '../context/ShoppingListContext.jsx';
import { getRecipeDetails } from '../api/client.js';

// Detail popup for a recipe. React escapes all text, so no XSS risk from
// recipe names or ingredient lines (unlike the old innerHTML approach).
export default function RecipeModal({ recipe, onClose }) {
  const { user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { addRecipe } = useShoppingList();
  const [addedToList, setAddedToList] = useState(false);
  // Cooking steps aren't in the search payload; fetch them when the modal opens.
  const [instructions, setInstructions] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  // Close on Escape for accessibility.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lazily load the recipe's instructions (one API call per opened recipe).
  useEffect(() => {
    if (!recipe?.id) return;
    // Use any steps already on the recipe; otherwise fetch them.
    if (recipe.instructions && recipe.instructions.length) {
      setInstructions(recipe.instructions);
      return;
    }
    let cancelled = false;
    setInstructions([]);
    setLoadingSteps(true);
    getRecipeDetails(recipe.id)
      .then((d) => {
        if (!cancelled) setInstructions(d.instructions || []);
      })
      .catch(() => {
        if (!cancelled) setInstructions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSteps(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipe?.id, recipe?.instructions]);

  if (!recipe) return null;

  const join = (arr) => (arr && arr.length ? arr.join(', ') : '—');
  // Edamam returns meal types / cuisines in lowercase (e.g. "lunch/dinner",
  // "american"); title-case each word for display.
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const joinCap = (arr) => (arr && arr.length ? arr.map(titleCase).join(', ') : '—');
  const saved = isFavorite(recipe.id);

  async function toggleFavorite() {
    if (saved) {
      await removeFavorite(recipe.id);
    } else {
      await addFavorite({
        recipeId: recipe.id,
        label: recipe.label,
        image: recipe.image,
        url: recipe.url,
      });
    }
  }

  async function addIngredientsToList() {
    const ingredients = recipe.ingredients || [];
    if (ingredients.length === 0) return;
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
        <h2 className="modal__title">{recipe.label}</h2>
        {recipe.image && <img className="modal__image" src={recipe.image} alt={recipe.label} />}

        {recipe.mealType?.length > 0 && (
          <p><strong>Meal type:</strong> {joinCap(recipe.mealType)}</p>
        )}
        {recipe.cuisineType?.length > 0 && (
          <p><strong>Cuisine:</strong> {joinCap(recipe.cuisineType)}</p>
        )}
        {recipe.dietLabels?.length > 0 && (
          <p><strong>Diet:</strong> {join(recipe.dietLabels)}</p>
        )}

        <h3>Ingredients</h3>
        <ul className="modal__ingredients">
          {(recipe.ingredients || []).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <h3>Instructions</h3>
        {loadingSteps ? (
          <p className="status">Loading instructions…</p>
        ) : instructions.length > 0 ? (
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

        <div className="modal__actions">
          {recipe.url && (
            <a className="modal__link" href={recipe.url} target="_blank" rel="noreferrer">
              View full recipe
            </a>
          )}
          {user ? (
            <>
              <button
                className={`fav-button ${saved ? 'fav-button--saved' : ''}`}
                onClick={toggleFavorite}
              >
                {saved ? '★ Saved' : '☆ Save to Favorites'}
              </button>
              <button className="fav-button" onClick={addIngredientsToList}>
                {addedToList ? '✓ Added to list' : '＋ Add ingredients to list'}
              </button>
            </>
          ) : (
            <span className="modal__hint">Log in to save favorites & build a shopping list</span>
          )}
        </div>

        {/* Source attribution — required by Spoonacular's terms of use. */}
        {recipe.source && (
          <p className="modal__source">
            Recipe by{' '}
            {recipe.url ? (
              <a href={recipe.url} target="_blank" rel="noreferrer">{recipe.source}</a>
            ) : (
              recipe.source
            )}
          </p>
        )}
      </div>
    </div>
  );
}
