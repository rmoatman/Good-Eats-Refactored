// Auth context: single source of truth for the logged-in user.
// Restores a session from a stored JWT on load and exposes
// login/register/logout/deleteAccount. Other contexts (favorites, shopping
// list) key off `user` here to know when to load or clear their data.
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking existing token

  // On load, if we have a stored token, fetch the current user.
  useEffect(() => {
    async function restore() {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await authApi.me();
        setUser(user);
      } catch {
        tokenStore.clear(); // token was invalid/expired
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    const { token, user } = await authApi.login(email, password);
    tokenStore.set(token);
    setUser(user);
  }

  async function register(email, password) {
    const { token, user } = await authApi.register(email, password);
    tokenStore.set(token);
    setUser(user);
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  // Permanently delete the account, then clear local session state.
  async function deleteAccount() {
    await authApi.deleteAccount();
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
