// Favorites context: holds the current user's saved recipes.
// Loads from the API on login and clears on logout, and keeps local state in
// sync by trusting the server's returned list after every add/remove.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { favoritesApi } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  // Load favorites whenever a user logs in; clear them on logout.
  // `cancelled` guards against a stale in-flight fetch resolving after the
  // user changed again (fast logout/login) and clobbering current state.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setFavorites([]);
        return;
      }
      try {
        const { favorites } = await favoritesApi.list();
        if (!cancelled) setFavorites(favorites);
      } catch {
        if (!cancelled) setFavorites([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Memoized so its identity only changes when `favorites` does — many recipe
  // cards call this, and a stable reference avoids re-running their effects /
  // re-rendering on every provider render.
  const isFavorite = useCallback(
    (recipeId) => favorites.some((f) => f.recipeId === recipeId),
    [favorites]
  );

  // Each mutation returns the server's full updated list, which we adopt
  // wholesale — no optimistic local edits, so client and server can't diverge.
  async function addFavorite(recipe) {
    const { favorites } = await favoritesApi.add(recipe);
    setFavorites(favorites);
  }

  async function removeFavorite(recipeId) {
    const { favorites } = await favoritesApi.remove(recipeId);
    setFavorites(favorites);
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, addFavorite, removeFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
