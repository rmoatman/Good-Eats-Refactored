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
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <ShoppingListProvider>
            <App />
          </ShoppingListProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
