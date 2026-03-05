import { useEffect, useState } from 'react';
import { compareVersions, fetchLatestVersion } from '../lib/versionCheck';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 Stunde
const STORAGE_KEY = 'nuruna-version-check-dismissed';

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
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
