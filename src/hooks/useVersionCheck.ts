import { useEffect, useState } from 'react';
import { compareVersions, fetchLatestVersion } from '../lib/versionCheck';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 Stunde
const STORAGE_KEY = 'nuruna-version-check-dismissed';

/**
 * Version-Check nur im Browser-Tab – TWA/PWA überspringen.
 * In TWA/PWA ist display-mode standalone/fullscreen, nie "browser".
 * So vermeiden wir das Popup in der Play-Store-App.
 */
function isBrowserTab(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: browser)').matches;
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!isBrowserTab()) return; // Nur im Browser-Tab prüfen, TWA/PWA überspringen

    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

    const check = async () => {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed) return;

      const latest = await fetchLatestVersion();
      if (!latest) return;

      setLatestVersion(latest);
      if (compareVersions(latest, currentVersion) > 0) {
        setUpdateAvailable(true);
      }
    };

    void check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const dismiss = () => {
    setUpdateAvailable(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  const reload = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return { updateAvailable, latestVersion, dismiss, reload };
}
