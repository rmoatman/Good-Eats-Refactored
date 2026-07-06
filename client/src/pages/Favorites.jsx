// Favorites — lists the logged-in user's saved recipes, each with a link out
// to the source recipe and a remove button. Requires auth; prompts to log in otherwise.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';

export default function Favorites() {
  const { user } = useAuth();
  const { favorites, removeFavorite } = useFavorites();

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
            <li key={f.recipeId} className="recipe-card">
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
