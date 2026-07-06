// Shopping list context: holds the current user's shopping list items.
// Loads from the API on login and clears on logout; every mutation replaces
// local state with the server's returned list so the two never drift.
import { createContext, useContext, useEffect, useState } from 'react';
import { shoppingApi } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const ShoppingListContext = createContext(null);

export function ShoppingListProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  // Load the list when a user logs in; clear it on logout.
  // `cancelled` guards against a stale in-flight fetch resolving after the
  // user changed again (fast logout/login) and clobbering current state.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setItems([]);
        return;
      }
      try {
        const { shoppingList } = await shoppingApi.list();
        if (!cancelled) setItems(shoppingList);
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Add all ingredient lines from a recipe.
  async function addRecipe(recipeLabel, ingredients) {
    const { shoppingList } = await shoppingApi.add(recipeLabel, ingredients);
    setItems(shoppingList);
  }

  async function toggleItem(itemId) {
    const { shoppingList } = await shoppingApi.toggle(itemId);
    setItems(shoppingList);
  }

  async function removeItem(itemId) {
    const { shoppingList } = await shoppingApi.remove(itemId);
    setItems(shoppingList);
  }

  async function clearList() {
    const { shoppingList } = await shoppingApi.clear();
    setItems(shoppingList);
  }

  // Ask the server to email the list. Returns the API response (or throws).
  function emailList() {
    return shoppingApi.email();
  }

  return (
    <ShoppingListContext.Provider
      value={{ items, count: items.length, addRecipe, toggleItem, removeItem, clearList, emailList }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error('useShoppingList must be used within a ShoppingListProvider');
  return ctx;
}
