// The dietary restriction checkboxes. Each value maps to an Edamam health label.
const FILTERS = [
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'peanut-free', label: 'Peanut Free' },
  { value: 'egg-free', label: 'Egg Free' },
  { value: 'wheat-free', label: 'Wheat Free' },
];

// Controlled component: `selected` is the array of active filter values owned by
// the parent; `onToggle` flips one value on/off so the parent can update state.
export default function DietaryFilters({ selected, onToggle }) {
  return (
    <fieldset className="filters">
      {/* Visually hidden legend keeps the checkbox group labeled for screen readers */}
      <legend className="sr-only">Dietary restrictions</legend>
      {FILTERS.map((f) => (
        <label key={f.value} className="filter">
          <input
            type="checkbox"
            // Checked state is derived from the parent's selected list, not local state
            checked={selected.includes(f.value)}
            onChange={() => onToggle(f.value)}
          />
          {f.label}
        </label>
      ))}
    </fieldset>
  );
}
