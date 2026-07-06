import { usePwaInstall } from '../context/PwaInstallContext.jsx';

// Install page (/install): explains how to add Good Eats to a phone or desktop
// as an installable web app. Linked from the site footer. Uses the shared
// .info-* content-page styles so its title formatting matches About and Privacy.
export default function Install() {
  // canInstall is true on Chromium browsers that have offered an install prompt;
  // installed is true when already running as an installed app.
  const { canInstall, installed, promptInstall } = usePwaInstall();

  return (
    <main className="info-page">
      {/* Page title block — eyebrow + headline + lead, same pattern as About/Privacy */}
      <p className="info-eyebrow">Install</p>
      <h1>Add Good Eats to your device.</h1>

      <p className="info-lead">
        Good Eats is an installable web app (PWA). It runs in any modern browser
        — no install required — but you can add it to your home screen or desktop
        for quick, app-like access, and it keeps working even on a flaky
        connection.
      </p>

      {/* One-tap install: only shown when the browser has offered a prompt.
          Otherwise (iOS, already installed, or prompt not yet available) users
          fall back to the manual per-platform steps below. */}
      {installed ? (
        <p className="install-status">✓ Good Eats is installed on this device.</p>
      ) : (
        canInstall && (
          <div className="install-cta">
            <button className="btn-install" type="button" onClick={promptInstall}>
              ⬇ Install Good Eats
            </button>
          </div>
        )
      )}

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
