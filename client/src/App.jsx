// Root layout + route table: persistent NavBar and Footer wrap the routed page.
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Favorites from './pages/Favorites.jsx';
import ShoppingList from './pages/ShoppingList.jsx';
import AuthForm from './pages/AuthForm.jsx';
import About from './pages/About.jsx';
import Install from './pages/Install.jsx';
import Privacy from './pages/Privacy.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { loading } = useAuth();

  // Avoid flashing the logged-out UI while we restore the session.
  if (loading) {
    return <div className="app"><p className="status">Loading…</p></div>;
  }

  return (
    <div className="app">
      <NavBar />
      <div className="page">
        {/* login vs. register reuse one AuthForm, switched by the mode prop */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />
          <Route path="/about" element={<About />} />
          <Route path="/install" element={<Install />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
