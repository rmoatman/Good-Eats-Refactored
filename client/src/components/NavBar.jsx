import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useShoppingList } from '../context/ShoppingListContext.jsx';
import logo from '../assets/logo.png';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { count } = useShoppingList();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        <img src={logo} alt="Good Eats" className="navbar__logo" />
      </Link>
      <div className="navbar__links">
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to="/favorites">Favorites</Link>
            <Link to="/shopping-list">
              Shopping List{count > 0 ? ` (${count})` : ''}
            </Link>
            <span className="navbar__email">{user.email}</span>
            <button className="navbar__logout" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
