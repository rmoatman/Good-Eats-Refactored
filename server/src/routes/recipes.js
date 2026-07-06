// Recipe search routes: a server-side proxy in front of the Spoonacular API.
// Two responsibilities:
//   1. Keep SPOONACULAR_API_KEY out of the browser — the client hits our
//      endpoints and we attach the secret key when calling upstream.
//   2. Conserve Spoonacular's daily "points" budget. Search returns only a
//      cheap list (id/title/image); the expensive full detail (ingredients,
//      steps, cuisine) is fetched one recipe at a time when a modal opens.
// When the daily point quota runs out Spoonacular replies HTTP 402; we translate
// that into a friendly "kitchen closed" message rather than leaking a raw error.
import { Router } from 'express';

const router = Router();

// complexSearch is the list/discovery endpoint (cheap). Per-recipe detail uses a
// different URL (/recipes/:id/information) built inline in the GET /:id handler.
const SPOONACULAR_BASE = 'https://api.spoonacular.com/recipes/complexSearch';

// Shown to users when Spoonacular's daily point quota is exhausted (HTTP 402),
// instead of a raw upstream error.
const KITCHEN_CLOSED_MESSAGE =
  "We're sorry, the kitchen is closed for restocking. It will re-open tomorrow. " +
  'Until then, you can still access your favorites. Bon Appétit!';

// The dietary-filter values the client sends map onto Spoonacular's
// "intolerances" parameter (comma-separated). Whitelisted so we never forward
// arbitrary user input upstream: only keys present in this map are ever passed
// on, so a bogus/injected health value is silently dropped rather than relayed.
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
  // analyzedInstructions is an array of "blocks" (e.g. a recipe with separate
  // sections), each holding an ordered steps[] array. Guard the shape because it
  // can be missing/malformed upstream. Flatten every block's steps into one
  // ordered list of step strings, dropping any empty/undefined entries.
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

    // Coerce to string + trim so an array/object query param can't break the
    // upstream URL and empty whitespace is treated as "no query".
    const q = (req.query.q || '').toString().trim();

    const params = new URLSearchParams();
    params.set('apiKey', SPOONACULAR_API_KEY);
    // Spoonacular is happy with an empty query, but a default keeps the initial
    // load looking intentional rather than random.
    params.set('query', q || 'dinner');
    params.set('number', '20');
    // Keep the search cheap on Spoonacular points: request only the list
    // (id + title + image). Full details — ingredients, steps, cuisine, etc. —
    // are loaded per-recipe when a modal opens (GET /:id below). This avoids
    // paying for detailed info on 20 recipes the user may never open.

    // health can arrive as a single value or an array (?health=a&health=b).
    // Normalize to an array: one repeated param → array; a lone param → wrap it;
    // nothing → empty array. Then split each value into Spoonacular's two
    // distinct concepts — "intolerances" (allergens) vs "diet" (vegan/veg).
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
      // Read the body once as text (not .json) so a non-JSON error page from
      // upstream doesn't throw here; we only echo a truncated slice below.
      const body = await response.text();
      // Daily quota used up — show the friendly "kitchen closed" message.
      if (response.status === 402) {
        return res.status(402).json({ error: KITCHEN_CLOSED_MESSAGE, code: 'QUOTA_EXCEEDED' });
      }
      // Pass through the upstream status but cap the relayed body: an
      // unexpectedly large error page shouldn't bloat our JSON response.
      return res.status(response.status).json({
        error: 'Recipe search failed upstream.',
        upstreamStatus: response.status,
        detail: body.slice(0, 500),
      });
    }

    const data = await response.json();

    // Minimal shape for the results grid; the modal fetches the rest via /:id.
    const recipes = (data.results || []).map((r) => ({
      id: String(r.id),
      label: r.title,
      image: r.image,
    }));

    // totalResults reflects the full upstream match count (may exceed the 20 we
    // fetched); fall back to the page size if upstream omits it.
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
    // encodeURIComponent guards the path segment against injection from the
    // client-supplied id. includeNutrition=false trims the payload (and cost).
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
    // Full detail shape the modal renders (metadata + ingredients + steps).
    res.json({
      id: String(r.id),
      label: r.title,
      image: r.image,
      // Prefer the original source link; fall back to Spoonacular's own page.
      url: r.sourceUrl || r.spoonacularSourceUrl || '',
      yield: r.servings,
      // Field names are remapped to the vocabulary the client already used with
      // the previous provider (Edamam), so the UI didn't need to change.
      mealType: r.dishTypes || [],
      cuisineType: r.cuisines || [],
      dietLabels: r.diets || [],
      // Spoonacular's terms require crediting the original source by name + link.
      source: r.sourceName || r.creditsText || '',
      ingredients: (r.extendedIngredients || []).map((i) => i.original).filter(Boolean),
      instructions: extractSteps(r),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
