import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useTranslation } from 'react-i18next';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const { isOnline } = useOffline();
  const { t } = useTranslation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">{t('common.loading')}</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={isOnline ? undefined : { offlineLoginRequired: true, message: t('offline.loginFirst') }}
      />
    );
  }

  return <Outlet />;
};
