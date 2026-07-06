// Auth context: single source of truth for the logged-in user.
// Restores a session from a stored JWT on load and exposes
// login/register/logout/deleteAccount. Other contexts (favorites, shopping
// list) key off `user` here to know when to load or clear their data.
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` starts true so consumers (route guards, nav) can wait out the
  // token check below instead of flashing a logged-out UI, then redirecting
  // once the restore resolves. It flips to false exactly once, after the first
  // check completes (whether or not a session was found).
  const [loading, setLoading] = useState(true); // true while checking existing token

  // On load, if we have a stored token, fetch the current user.
  useEffect(() => {
    async function restore() {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        // /me validates the token server-side and echoes back the user record.
        const { user } = await authApi.me();
        setUser(user);
      } catch {
        tokenStore.clear(); // token was invalid/expired — drop it so we don't retry
      } finally {
        setLoading(false);
      }
    }
    restore();
    // Empty deps: run once on mount. Login/logout update `user` directly, so
    // there's nothing to re-restore afterward.
  }, []);

  // Persist the token first so any request fired right after setUser (e.g. the
  // favorites/shopping-list loads that key off `user`) already sees it.
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
