// A single recipe row in the results list. Clicking opens the detail modal.
export default function RecipeCard({ recipe, onOpen }) {
  return (
    <li className="recipe-card">
      {/* Whole card is one button so the entire row is the click target */}
      <button className="recipe-card__button" onClick={() => onOpen(recipe)}>
        {/* Some Edamam results have no image; skip the img rather than render a broken one */}
        {recipe.image && (
          <img className="recipe-card__image" src={recipe.image} alt={recipe.label} />
        )}
        <span className="recipe-card__body">
          <span className="recipe-card__title">{recipe.label}</span>
          {/* yield is the serving count; fall back to N/A when the API omits it */}
          <span className="recipe-card__meta">Servings: {recipe.yield ?? 'N/A'}</span>
        </span>
      </button>
    </li>
  );
}
