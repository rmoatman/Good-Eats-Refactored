// App entry point: mounts React and wraps <App /> in the router + global
// context providers. Provider order matters — Favorites and ShoppingList read
// the auth token, so AuthProvider must sit outermost of the three.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { ShoppingListProvider } from './context/ShoppingListContext.jsx';
import { PwaInstallProvider } from './context/PwaInstallContext.jsx';
import './styles.css';

// Capture the PWA install prompt as early as possible — it can fire before
// React finishes mounting. We stash it and notify PwaInstallProvider.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // suppress Chrome's default mini-infobar; we trigger it ourselves
  window.__deferredInstallPrompt = e;
  window.dispatchEvent(new Event('pwa:installable'));
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <ShoppingListProvider>
            <PwaInstallProvider>
              <App />
            </PwaInstallProvider>
          </ShoppingListProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
