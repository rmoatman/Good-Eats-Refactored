// The dietary restriction checkboxes. Each value maps to an Edamam health label.
const FILTERS = [
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'peanut-free', label: 'Peanut Free' },
  { value: 'egg-free', label: 'Egg Free' },
  { value: 'wheat-free', label: 'Wheat Free' },
];

export default function DietaryFilters({ selected, onToggle }) {
  return (
    <fieldset className="filters">
      <legend className="sr-only">Dietary restrictions</legend>
      {FILTERS.map((f) => (
        <label key={f.value} className="filter">
          <input
            type="checkbox"
            checked={selected.includes(f.value)}
            onChange={() => onToggle(f.value)}
          />
          {f.label}
        </label>
      ))}
    </fieldset>
  );
}
