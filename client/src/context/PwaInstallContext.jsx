import { createContext, useContext, useEffect, useState } from 'react';

// Tracks whether the browser will let us show a native "install app" prompt.
//
// The `beforeinstallprompt` event fires once, early, and can be captured before
// React mounts — so main.jsx stashes it on window.__deferredInstallPrompt and
// dispatches a 'pwa:installable' event. This provider reads from there so the
// prompt is never missed regardless of timing.
//
// Note: `beforeinstallprompt` is Chromium-only (Chrome/Edge/Android). iOS
// Safari never fires it, so `canInstall` stays false there and the Install page
// falls back to its manual "Add to Home Screen" instructions.
const PwaInstallContext = createContext(null);

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes standalone mode via a non-standard navigator flag.
    window.navigator.standalone === true
  );
}

export function PwaInstallProvider({ children }) {
  // Lazy initializers read the state that main.jsx may already have captured
  // before React mounted — the event can fire before this component exists.
  const [deferred, setDeferred] = useState(() => window.__deferredInstallPrompt || null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    // The early listener in main.jsx may fire after this provider mounts, so
    // listen for its custom event too (and re-read the stashed prompt).
    const onAvailable = () => setDeferred(window.__deferredInstallPrompt || null);
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      window.__deferredInstallPrompt = null;
    };
    window.addEventListener('pwa:installable', onAvailable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('pwa:installable', onAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Shows the browser's native install dialog. Returns 'accepted' | 'dismissed'
  // | null (no prompt available). A prompt can only be used once, so we clear it.
  async function promptInstall() {
    // Read the live window stash (not the `deferred` state) so we use the real
    // browser event object even if a render hasn't synced state yet.
    const evt = window.__deferredInstallPrompt;
    if (!evt) return null;
    evt.prompt();
    const { outcome } = await evt.userChoice;
    window.__deferredInstallPrompt = null;
    setDeferred(null);
    return outcome;
  }

  // canInstall drives whether the in-app Install button renders: true only when
  // we're holding a usable prompt AND the app isn't already installed/standalone.
  return (
    <PwaInstallContext.Provider
      value={{ canInstall: !!deferred && !installed, installed, promptInstall }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error('usePwaInstall must be used within a PwaInstallProvider');
  return ctx;
}
