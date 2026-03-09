import { Navigate, useLocation } from 'react-router-dom';
import { useOffline, isOfflineAllowedPath } from '../context/OfflineContext';

/**
 * When offline, only /hatim, /quran, /quran/read are allowed.
 * Other routes redirect to /quran with offline message.
 */
export function OfflineGuard({ children }: { children: React.ReactNode }) {
  const { isOnline } = useOffline();
  const location = useLocation();
  const pathname = location.pathname;

  if (isOnline) return <>{children}</>;

  if (isOfflineAllowedPath(pathname)) return <>{children}</>;

  return (
    <Navigate
      to="/quran"
      replace
      state={{ from: pathname, offlineRedirect: true }}
    />
  );
}
