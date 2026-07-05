import { Router } from 'express';

const router = Router();

const YELP_BASE = 'https://api.yelp.com/v3/businesses/search';

/**
 * GET /api/restaurants
 * Query either by:
 *   - location:  ?location=43015   (zip code or address), or
 *   - coords:    ?lat=40.1&lng=-83.1  (browser geolocation)
 *
 * Proxies Yelp Fusion so the API key stays on the server.
 */
router.get('/', async (req, res, next) => {
  try {
    const { YELP_API_KEY } = process.env;
    if (!YELP_API_KEY) {
      return res.status(500).json({ error: 'Yelp API key is not configured on the server.' });
    }

    const { location, lat, lng } = req.query;

    const params = new URLSearchParams();
    params.set('term', 'restaurants');
    params.set('categories', 'restaurants');
    params.set('limit', '10');
    params.set('sort_by', 'distance');

    if (lat && lng) {
      params.set('latitude', String(lat));
      params.set('longitude', String(lng));
    } else if (location) {
      params.set('location', String(location).trim());
    } else {
      return res.status(400).json({ error: 'Provide either a location (zip) or lat/lng.' });
    }

    const response = await fetch(`${YELP_BASE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({
        error: 'Restaurant search failed upstream.',
        upstreamStatus: response.status,
        detail: body.slice(0, 300),
      });
    }

    const data = await response.json();

    // Trim to what the UI needs.
    const restaurants = (data.businesses || []).map((b) => ({
      id: b.id,
      name: b.name,
      phone: b.display_phone || b.phone || '',
      address: (b.location?.display_address || []).join(', '),
      rating: b.rating,
      reviewCount: b.review_count,
      price: b.price || '',
      categories: (b.categories || []).map((c) => c.title),
      image: b.image_url || '',
      url: b.url, // link to the Yelp listing
      distanceMeters: b.distance,
    }));

    res.json({ total: data.total ?? restaurants.length, restaurants });
  } catch (err) {
    next(err);
  }
});

export default router;
