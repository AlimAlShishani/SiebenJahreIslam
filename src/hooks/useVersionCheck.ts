import { useEffect, useState } from 'react';
import { compareVersions, fetchLatestVersion } from '../lib/versionCheck';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 Stunde
const STORAGE_KEY = 'nuruna-version-check-dismissed';

/** TWA/Play-Store-App: Version-Check überspringen – Updates kommen über Play Store. */
function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
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
