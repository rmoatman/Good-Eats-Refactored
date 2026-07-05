export default function Install() {
  return (
    <section className="main info-page">
      <h2 className="results__header">Install the App</h2>
      <p>
        Good Eats runs in any modern browser — no install required. If you'd
        like quick access from your home screen or desktop, you can add it as an
        app:
      </p>

      <h3>iPhone / iPad (Safari)</h3>
      <ol>
        <li>Open Good Eats in Safari.</li>
        <li>Tap the Share button (the square with an up arrow).</li>
        <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
      </ol>

      <h3>Android (Chrome)</h3>
      <ol>
        <li>Open Good Eats in Chrome.</li>
        <li>Tap the ⋮ menu in the top-right.</li>
        <li>Choose <strong>Add to Home screen</strong> and confirm.</li>
      </ol>

      <h3>Desktop (Chrome / Edge)</h3>
      <ol>
        <li>Open Good Eats in the browser.</li>
        <li>Click the install icon in the address bar (or the ⋮ menu → <strong>Install</strong>).</li>
        <li>Confirm to add it as a desktop app.</li>
      </ol>
    </section>
  );
}
