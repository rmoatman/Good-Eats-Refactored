import { useState } from 'react';
import { searchRestaurants } from '../api/client.js';

// Finds nearby restaurants either by the browser's geolocation or by a
// zip code the user types. Replaces the old Documenu feature.
export default function RestaurantFinder() {
  const [zip, setZip] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | locating | loading | error
  const [error, setError] = useState('');

  // Single request path for both search modes; `query` is passed straight to the
  // /api/restaurants endpoint (either {lat,lng} or {location}).
  async function runSearch(query) {
    setStatus('loading');
    setError('');
    try {
      const data = await searchRestaurants(query);
      setRestaurants(data.restaurants);
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function useMyLocation() {
    // Older/permission-restricted browsers may lack geolocation; steer to zip fallback.
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Try a zip code.');
      setStatus('error');
      return;
    }
    // 'locating' covers the async prompt/lookup before the actual search fires.
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      // Success: search by coordinates. Failure (denied/unavailable): prompt for a zip.
      (pos) => runSearch({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setError('Could not get your location. Enter a zip code instead.');
        setStatus('error');
      }
    );
  }

  function handleZipSubmit(e) {
    e.preventDefault();
    // Ignore empty/whitespace-only input so we don't fire a meaningless search.
    if (zip.trim()) runSearch({ location: zip.trim() });
  }

  return (
    <aside className="restaurants">
      <h3 className="restaurants__title">Don't want to cook?</h3>
      <p className="restaurants__sub">Find restaurants near you.</p>

      <button className="search__button" onClick={useMyLocation} disabled={status === 'locating'}>
        {status === 'locating' ? 'Locating…' : 'Use my location'}
      </button>

      <form className="restaurants__zip" onSubmit={handleZipSubmit}>
        <input
          className="search__input"
          type="text"
          inputMode="numeric"
          placeholder="Or enter a zip code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />
        <button className="search__button" type="submit">Search</button>
      </form>

      {/* Mutually exclusive status messages driven by the `status` state machine */}
      {status === 'loading' && <p className="status">Finding restaurants…</p>}
      {status === 'error' && <p className="status status--error">{error}</p>}
      {/* Empty-state hint shown only before the first successful search */}
      {status === 'idle' && restaurants.length === 0 && (
        <p className="status">No restaurants to show yet.</p>
      )}

      <ul className="restaurant-list">
        {restaurants.map((r) => (
          <li key={r.id} className="restaurant-card">
            <div className="restaurant-card__head">
              <a href={r.url} target="_blank" rel="noreferrer" className="restaurant-card__name">
                {r.name}
              </a>
              {/* Hide the rating badge when a place has no reviews yet (rating 0) */}
              {r.rating > 0 && (
                <span className="restaurant-card__rating">
                  ★ {r.rating} ({r.reviewCount})
                </span>
              )}
            </div>
            {r.categories.length > 0 && (
              <p className="restaurant-card__cats">
                {r.categories.join(', ')}{r.price ? ` · ${r.price}` : ''}
              </p>
            )}
            {r.address && <p className="restaurant-card__addr">{r.address}</p>}
            {r.phone && <p className="restaurant-card__phone">{r.phone}</p>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
