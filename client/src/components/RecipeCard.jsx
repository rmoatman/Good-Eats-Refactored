// A single recipe row in the results list. Clicking opens the detail modal.
export default function RecipeCard({ recipe, onOpen }) {
  return (
    <li className="recipe-card">
      <button className="recipe-card__button" onClick={() => onOpen(recipe)}>
        {recipe.image && (
          <img className="recipe-card__image" src={recipe.image} alt={recipe.label} />
        )}
        <span className="recipe-card__body">
          <span className="recipe-card__title">{recipe.label}</span>
          <span className="recipe-card__meta">Servings: {recipe.yield ?? 'N/A'}</span>
        </span>
      </button>
    </li>
  );
}
