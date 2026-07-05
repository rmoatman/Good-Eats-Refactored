import { Router } from 'express';

const router = Router();

const EDAMAM_BASE = 'https://api.edamam.com/api/recipes/v2';

// Health-label values Edamam accepts, so we can safely whitelist user input.
const ALLOWED_HEALTH = new Set([
  'dairy-free',
  'egg-free',
  'gluten-free',
  'wheat-free',
  'peanut-free',
  'tree-nut-free',
  'soy-free',
  'fish-free',
  'shellfish-free',
  'vegetarian',
  'vegan',
]);

/**
 * GET /api/recipes/search?q=chicken&health=gluten-free&health=dairy-free
 * Proxies Edamam's Recipe Search v2 API so the app_id/app_key stay server-side.
 */
router.get('/search', async (req, res, next) => {
  try {
    const { EDAMAM_APP_ID, EDAMAM_APP_KEY, EDAMAM_ACCOUNT_USER } = process.env;
    if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
      return res.status(500).json({ error: 'Edamam credentials are not configured on the server.' });
    }

    const q = (req.query.q || '').toString().trim();

    const params = new URLSearchParams();
    params.set('type', 'public');
    // Edamam requires a non-empty query; default to a broad term for the initial load.
    params.set('q', q || 'dinner');
    params.set('app_id', EDAMAM_APP_ID);
    params.set('app_key', EDAMAM_APP_KEY);

    // health can arrive as a single value or an array (?health=a&health=b).
    const rawHealth = req.query.health;
    const healthValues = Array.isArray(rawHealth) ? rawHealth : rawHealth ? [rawHealth] : [];
    for (const h of healthValues) {
      if (ALLOWED_HEALTH.has(h)) params.append('health', h);
    }

    const edamamUrl = `${EDAMAM_BASE}?${params.toString()}`;

    const headers = {};
    // Newer Edamam accounts require this header; harmless if unset.
    if (EDAMAM_ACCOUNT_USER) headers['Edamam-Account-User'] = EDAMAM_ACCOUNT_USER;

    const response = await fetch(edamamUrl, { headers });
    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({
        error: 'Recipe search failed upstream.',
        upstreamStatus: response.status,
        detail: body.slice(0, 500),
      });
    }

    const data = await response.json();

    // Return a trimmed shape the client actually uses, not Edamam's full payload.
    const recipes = (data.hits || []).map(({ recipe }) => ({
      id: recipe.uri ? recipe.uri.split('#recipe_').pop() : null,
      label: recipe.label,
      image: recipe.image,
      url: recipe.url,
      yield: recipe.yield,
      mealType: recipe.mealType || [],
      cuisineType: recipe.cuisineType || [],
      dietLabels: recipe.dietLabels || [],
      healthLabels: recipe.healthLabels || [],
      ingredients: (recipe.ingredientLines || []),
    }));

    res.json({ count: data.count ?? recipes.length, recipes });
  } catch (err) {
    next(err);
  }
});

export default router;
