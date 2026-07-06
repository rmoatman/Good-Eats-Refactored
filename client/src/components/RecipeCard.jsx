// A single recipe row in the results list. The search payload is intentionally
// minimal (id, label, image) to save API points — full details load when the
// card is clicked and the modal opens.
export default function RecipeCard({ recipe, onOpen }) {
  return (
    <li className="recipe-card">
      {/* Whole card is one button so the entire row is the click target */}
      <button className="recipe-card__button" onClick={() => onOpen(recipe)}>
        {/* Some results have no image; skip the img rather than render a broken one */}
        {recipe.image && (
          <img className="recipe-card__image" src={recipe.image} alt={recipe.label} />
        )}
        <span className="recipe-card__body">
          <span className="recipe-card__title">{recipe.label}</span>
        </span>
      </button>
    </li>
  );
}
