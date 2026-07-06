// ShoppingList — shows the user's saved ingredient items grouped by the recipe
// they came from, with check-off, remove, clear, print, and email actions.
// Requires auth; prompts to log in otherwise.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useShoppingList } from '../context/ShoppingListContext.jsx';

export default function ShoppingList() {
  const { user } = useAuth();
  const { items, toggleItem, removeItem, clearList, emailList } = useShoppingList();
  const [emailStatus, setEmailStatus] = useState(''); // '', 'sending', message

  if (!user) {
    return (
      <section className="main">
        <h2 className="results__header">Shopping List</h2>
        <p className="status">
          Please <Link to="/login">log in</Link> to build a shopping list.
        </p>
      </section>
    );
  }

  // Group items by their source recipe, preserving insertion order.
  const groups = [];
  const index = new Map();
  for (const item of items) {
    const key = item.recipeLabel || 'Other items';
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({ label: key, items: [] });
    }
    groups[index.get(key)].items.push(item);
  }

  async function handleEmail() {
    setEmailStatus('sending');
    try {
      const res = await emailList();
      setEmailStatus(`Sent to ${res.to} ✓`);
    } catch (err) {
      setEmailStatus(err.message);
    }
  }

  return (
    <section className="main shopping">
      <div className="shopping__header no-print">
        <h2 className="results__header">Shopping List</h2>
        {items.length > 0 && (
          <div className="shopping__actions">
            <button className="search__button" onClick={() => window.print()}>Print</button>
            <button className="search__button" onClick={handleEmail} disabled={emailStatus === 'sending'}>
              {emailStatus === 'sending' ? 'Sending…' : 'Email to me'}
            </button>
            <button className="fav-remove" onClick={clearList}>Clear list</button>
          </div>
        )}
      </div>

      {emailStatus && emailStatus !== 'sending' && (
        <p className="status no-print">{emailStatus}</p>
      )}

      {/* Printed heading (only shows on paper) */}
      <h2 className="print-only">Good Eats Shopping List</h2>

      {items.length === 0 ? (
        <p className="status">
          Your list is empty. Open a recipe and tap “Add ingredients to list”.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="shopping-group">
            <h3 className="shopping-group__title">{group.label}</h3>
            <ul className="shopping-group__items">
              {group.items.map((item) => (
                <li key={item._id} className={`shopping-item ${item.checked ? 'shopping-item--checked' : ''}`}>
                  <label className="shopping-item__label">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item._id)}
                    />
                    <span>{item.text}</span>
                  </label>
                  <button
                    className="shopping-item__remove no-print"
                    onClick={() => removeItem(item._id)}
                    aria-label={`Remove ${item.text}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
