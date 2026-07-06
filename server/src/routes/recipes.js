import { Router } from 'express';

const router = Router();

const SPOONACULAR_BASE = 'https://api.spoonacular.com/recipes/complexSearch';

// Shown to users when Spoonacular's daily point quota is exhausted (HTTP 402),
// instead of a raw upstream error.
const KITCHEN_CLOSED_MESSAGE =
  "We're sorry, the kitchen is closed for restocking. It will re-open tomorrow. " +
  'Until then, you can still access your favorites. Bon Appétit!';

// The dietary-filter values the client sends map onto Spoonacular's
// "intolerances" parameter (comma-separated). Whitelisted so we never forward
// arbitrary user input upstream.
const INTOLERANCE_MAP = {
  'gluten-free': 'gluten',
  'dairy-free': 'dairy',
  'egg-free': 'egg',
  'peanut-free': 'peanut',
  'tree-nut-free': 'tree nut',
  'soy-free': 'soy',
  'wheat-free': 'wheat',
  'fish-free': 'seafood',
  'shellfish-free': 'shellfish',
};

// A couple of values are diets rather than intolerances in Spoonacular.
const DIET_MAP = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
};

// Pull an ordered list of instruction step strings out of Spoonacular's
// analyzedInstructions, so the client can show steps in-app rather than relying
// on the (sometimes dead) source link.
function extractSteps(recipe) {
  const blocks = Array.isArray(recipe.analyzedInstructions)
    ? recipe.analyzedInstructions
    : [];
  const steps = blocks.flatMap((b) => (b.steps || []).map((s) => s.step)).filter(Boolean);
  return steps;
}

/**
 * GET /api/recipes/search?q=chicken&health=gluten-free&health=dairy-free
 * Proxies Spoonacular's complexSearch so the API key stays server-side, and
 * returns the same trimmed shape the client already consumes.
 */
router.get('/search', async (req, res, next) => {
  try {
    const { SPOONACULAR_API_KEY } = process.env;
    if (!SPOONACULAR_API_KEY) {
      return res.status(500).json({ error: 'Spoonacular API key is not configured on the server.' });
    }

    const q = (req.query.q || '').toString().trim();

    const params = new URLSearchParams();
    params.set('apiKey', SPOONACULAR_API_KEY);
    // Spoonacular is happy with an empty query, but a default keeps the initial
    // load looking intentional rather than random.
    params.set('query', q || 'dinner');
    params.set('number', '20');
    // Return full recipe info (ingredients + instructions) in one call so the
    // detail modal doesn't need a second request.
    params.set('addRecipeInformation', 'true');
    params.set('fillIngredients', 'true');

    // health can arrive as a single value or an array (?health=a&health=b).
    const rawHealth = req.query.health;
    const healthValues = Array.isArray(rawHealth) ? rawHealth : rawHealth ? [rawHealth] : [];
    const intolerances = [];
    const diets = [];
    for (const h of healthValues) {
      if (INTOLERANCE_MAP[h]) intolerances.push(INTOLERANCE_MAP[h]);
      else if (DIET_MAP[h]) diets.push(DIET_MAP[h]);
    }
    if (intolerances.length) params.set('intolerances', intolerances.join(','));
    if (diets.length) params.set('diet', diets.join(','));

    const response = await fetch(`${SPOONACULAR_BASE}?${params.toString()}`);
    if (!response.ok) {
      const body = await response.text();
      // Daily quota used up — show the friendly "kitchen closed" message.
      if (response.status === 402) {
        return res.status(402).json({ error: KITCHEN_CLOSED_MESSAGE, code: 'QUOTA_EXCEEDED' });
      }
      return res.status(response.status).json({
        error: 'Recipe search failed upstream.',
        upstreamStatus: response.status,
        detail: body.slice(0, 500),
      });
    }

    const data = await response.json();

    // Map Spoonacular's shape onto the shape the client already expects.
    const recipes = (data.results || []).map((r) => ({
      id: String(r.id),
      label: r.title,
      image: r.image,
      url: r.sourceUrl || r.spoonacularSourceUrl || '',
      yield: r.servings,
      mealType: r.dishTypes || [],
      cuisineType: r.cuisines || [],
      dietLabels: r.diets || [],
      healthLabels: [],
      // Spoonacular's terms require crediting the original source by name + link.
      source: r.sourceName || r.creditsText || '',
      ingredients: (r.extendedIngredients || []).map((i) => i.original).filter(Boolean),
      instructions: extractSteps(r),
    }));

    res.json({ count: data.totalResults ?? recipes.length, recipes });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/recipes/:id
 * Fetches a single recipe's full details from Spoonacular. complexSearch does
 * not include cooking steps, so the client calls this lazily when a recipe
 * modal opens to show instructions in-app (rather than relying on the source
 * link, which is sometimes dead).
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { SPOONACULAR_API_KEY } = process.env;
    if (!SPOONACULAR_API_KEY) {
      return res.status(500).json({ error: 'Spoonacular API key is not configured on the server.' });
    }
    const id = encodeURIComponent(req.params.id);
    const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      if (response.status === 402) {
        return res.status(402).json({ error: KITCHEN_CLOSED_MESSAGE, code: 'QUOTA_EXCEEDED' });
      }
      return res.status(response.status).json({
        error: 'Recipe details failed upstream.',
        upstreamStatus: response.status,
        detail: body.slice(0, 500),
      });
    }
    const r = await response.json();
    res.json({
      id: String(r.id),
      ingredients: (r.extendedIngredients || []).map((i) => i.original).filter(Boolean),
      instructions: extractSteps(r),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
