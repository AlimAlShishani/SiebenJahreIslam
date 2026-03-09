import { useEffect, useState } from 'react';
import { compareVersions, fetchLatestVersion } from '../lib/versionCheck';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 Stunde
const STORAGE_KEY = 'nuruna-version-check-dismissed';

const TWA_PACKAGE = 'net.nuruna.twa';
const TWA_HASH = '#play-store-twa';

/** TWA/Play-Store-App: Version-Check überspringen – Updates kommen über Play Store. */
function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  // TWA: Referrer enthält android-app:// (zuverlässig auf Android)
  if (document.referrer.includes(`android-app://${TWA_PACKAGE}`)) return true;
  if (document.referrer.startsWith('android-app://')) return true;
  // TWA: StartUrl-Hash (Fallback z.B. für ChromeOS)
  if (window.location.hash === TWA_HASH) return true;
  if (sessionStorage.getItem('is_play_store_twa') === 'yes') return true;
  // PWA: Standalone/Fullscreen
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  if ((window.navigator as { standalone?: boolean }).standalone === true) return true;
  return false;
}

/** Beim Start: TWA-Erkennung in sessionStorage speichern (für spätere Navigationen). */
function persistTwaDetection(): void {
  if (typeof window === 'undefined') return;
  if (document.referrer.includes(`android-app://${TWA_PACKAGE}`)) {
    sessionStorage.setItem('is_play_store_twa', 'yes');
  }
  if (document.referrer.startsWith('android-app://')) {
    sessionStorage.setItem('is_play_store_twa', 'yes');
  }
  if (window.location.hash === TWA_HASH) {
    sessionStorage.setItem('is_play_store_twa', 'yes');
  }
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    persistTwaDetection();
    if (isStandaloneApp()) return; // TWA: kein Version-Check, Play Store regelt Updates

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
