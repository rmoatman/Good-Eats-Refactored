// Install page (/install): explains how to add Good Eats to a phone or desktop
// as an installable web app. Linked from the site footer. Uses the shared
// .info-* content-page styles so its title formatting matches About and Privacy.
export default function Install() {
  return (
    <main className="info-page">
      {/* Page title block — eyebrow + headline + lead, same pattern as About/Privacy */}
      <p className="info-eyebrow">Install</p>
      <h1>Add Good Eats to your device.</h1>

      <p className="info-lead">
        Good Eats runs in any modern browser — no install required. For quick
        access from your home screen or desktop, you can add it as an app.
      </p>

      {/* One labeled section per platform, each with numbered steps */}
      <p className="info-section-label">iPhone / iPad (Safari)</p>
      <ol>
        <li>Open Good Eats in Safari.</li>
        <li>Tap the Share button (the square with an up arrow).</li>
        <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
      </ol>

      <p className="info-section-label">Android (Chrome)</p>
      <ol>
        <li>Open Good Eats in Chrome.</li>
        <li>Tap the ⋮ menu in the top-right.</li>
        <li>Choose <strong>Add to Home screen</strong> and confirm.</li>
      </ol>

      <p className="info-section-label">Desktop (Chrome / Edge)</p>
      <ol>
        <li>Open Good Eats in the browser.</li>
        <li>Click the install icon in the address bar (or the ⋮ menu → <strong>Install</strong>).</li>
        <li>Confirm to add it as a desktop app.</li>
      </ol>
    </main>
  );
}
