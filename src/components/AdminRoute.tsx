import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Admin from '../pages/Admin';

export const AdminRoute = () => {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    void supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setRole(data?.role ?? 'user');
      })
      .then(() => setChecking(false), () => setChecking(false));
  }, [user]);

  if (loading || checking) {
    return <div className="flex items-center justify-center h-screen">Laden...</div>;
  }

  if (!user || role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return <Admin />;
};
