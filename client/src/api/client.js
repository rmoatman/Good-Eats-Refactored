// Central API client: a thin fetch wrapper (JSON + Bearer auth, error
// unwrapping) plus grouped endpoint helpers for the Express backend.

// In dev, VITE_API_URL is empty and Vite proxies /api to the Express server.
// In production, set VITE_API_URL to the deployed API origin.
const API_BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'goodeats_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Core fetch wrapper: adds the JSON + auth headers and unwraps errors.
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Fall back to {} so a non-JSON/empty body (e.g. 204) doesn't throw on parse.
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface the server's error message when present, else a generic status.
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// --- Recipes ---
export async function searchRecipes(query, healthLabels = []) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  // append (not set) so multiple health filters serialize as repeated params.
  for (const label of healthLabels) params.append('health', label);
  return request(`/api/recipes/search?${params.toString()}`);
}

// Full details (cooking steps) for one recipe — fetched when its modal opens.
export async function getRecipeDetails(id) {
  return request(`/api/recipes/${encodeURIComponent(id)}`);
}

// --- Auth ---
export const authApi = {
  register: (email, password) =>
    request('/api/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me', { auth: true }),
  deleteAccount: () => request('/api/auth/account', { method: 'DELETE', auth: true }),
};

// --- Restaurants (no auth) ---
export function searchRestaurants({ location, lat, lng }) {
  const params = new URLSearchParams();
  // Prefer precise device coordinates; fall back to a typed location string.
  if (lat != null && lng != null) {
    params.set('lat', lat);
    params.set('lng', lng);
  } else if (location) {
    params.set('location', location);
  }
  return request(`/api/restaurants?${params.toString()}`);
}

// --- Shopping list (all require auth) ---
export const shoppingApi = {
  list: () => request('/api/shopping-list', { auth: true }),
  add: (recipeLabel, items) =>
    request('/api/shopping-list', { method: 'POST', auth: true, body: { recipeLabel, items } }),
  toggle: (itemId) =>
    request(`/api/shopping-list/${itemId}`, { method: 'PATCH', auth: true }),
  remove: (itemId) =>
    request(`/api/shopping-list/${itemId}`, { method: 'DELETE', auth: true }),
  clear: () => request('/api/shopping-list', { method: 'DELETE', auth: true }),
  email: () => request('/api/shopping-list/email', { method: 'POST', auth: true }),
};

// --- Favorites (all require auth) ---
export const favoritesApi = {
  list: () => request('/api/favorites', { auth: true }),
  add: (recipe) => request('/api/favorites', { method: 'POST', auth: true, body: recipe }),
  remove: (recipeId) =>
    request(`/api/favorites/${encodeURIComponent(recipeId)}`, { method: 'DELETE', auth: true }),
};
