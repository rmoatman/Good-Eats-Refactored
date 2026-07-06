// Warm, non-alarming notice shown when the recipe API's daily quota is used up
// (server responds with code 'QUOTA_EXCEEDED'). Used by the search results and
// the recipe modal in place of a harsh red error.
export default function KitchenClosed({ message }) {
  return (
    <div className="kitchen-closed" role="status">
      <span className="kitchen-closed__emoji" aria-hidden="true">👨‍🍳</span>
      <p className="kitchen-closed__text">{message}</p>
    </div>
  );
}
