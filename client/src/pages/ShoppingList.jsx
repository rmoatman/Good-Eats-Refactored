// ShoppingList — shows the user's saved ingredient items grouped by the recipe
// they came from, with check-off, remove, clear, print, and email actions.
// Requires auth; prompts to log in otherwise.
//
// The item list and all mutations live in ShoppingListContext; this page only
// renders them and groups them for display. Printing is handled purely with CSS
// (the .no-print / .print-only classes) plus the browser's window.print().
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useShoppingList } from '../context/ShoppingListContext.jsx';

export default function ShoppingList() {
  const { user } = useAuth();
  const { items, toggleItem, removeItem, clearList, emailList } = useShoppingList();
  // Tracks the email action: '' (idle), 'sending' (in flight), or a result
  // message string (success confirmation or error text) to show the user.
  const [emailStatus, setEmailStatus] = useState('');

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
  // `index` maps a recipe label -> its position in `groups`, so each label gets
  // exactly one group and groups appear in the order their first item was added.
  // Items with no recipeLabel fall into a shared "Other items" bucket.
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

  // Email the whole list to the logged-in user's address (the server knows it
  // from the session, so no address is passed). Reflect progress/result in
  // emailStatus; on success show the address the server reported sending to.
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
      {/* .no-print hides these controls when the list is sent to the printer. */}
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

      {/* Show the email result (success or error) once it's no longer sending. */}
      {emailStatus && emailStatus !== 'sending' && (
        <p className="status no-print">{emailStatus}</p>
      )}

      {/* Printed heading — hidden on screen, .print-only reveals it on paper so
          the printout has a title even though the on-screen header is .no-print. */}
      <h2 className="print-only">Good Eats Shopping List</h2>

      {items.length === 0 ? (
        <p className="status">
          Your list is empty. Open a recipe and tap “Add ingredients to list”.
        </p>
      ) : (
        // One block per recipe group, each listing its ingredient items.
        groups.map((group) => (
          <div key={group.label} className="shopping-group">
            <h3 className="shopping-group__title">{group.label}</h3>
            <ul className="shopping-group__items">
              {group.items.map((item) => (
                // Checked items get a modifier class for the strike-through styling.
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
