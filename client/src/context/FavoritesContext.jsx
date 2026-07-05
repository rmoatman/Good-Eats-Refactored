import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { favoritesApi } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  // Load favorites whenever a user logs in; clear them on logout.
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

  const isFavorite = useCallback(
    (recipeId) => favorites.some((f) => f.recipeId === recipeId),
    [favorites]
  );

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
