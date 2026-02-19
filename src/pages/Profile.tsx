import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Save, Mail, Hash, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setFullName(data.full_name || '');
      setRole(data.role);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      setMessage('Fehler beim Speichern: ' + error.message);
    } else {
      setMessage('Profil erfolgreich aktualisiert!');
      // Kurze Verzögerung, dann Nachricht ausblenden
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Mein Profil</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-emerald-100 dark:border-gray-600 overflow-hidden">
        {/* Header mit Avatar */}
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-6 flex flex-col items-center justify-center border-b border-emerald-100 dark:border-gray-600">
          <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-4xl font-bold shadow-sm mb-3 border-4 border-white dark:border-gray-800">
            {(fullName || user?.email || '?')[0].toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-gray-100">{fullName || 'Benutzer'}</h3>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm">{user?.email}</p>
          {role === 'admin' && (
            <span className="mt-2 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Shield size={12} /> Admin
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Admin Link - Only visible for admins */}
          {role === 'admin' && (
            <Link 
              to="/admin"
              className="w-full bg-gray-800 dark:bg-gray-700 text-white py-3 rounded-xl hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-bold shadow-md"
            >
              <Shield size={20} /> Zum Admin Dashboard
            </Link>
          )}

          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Anzeigename ändern</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Wie möchtest du heißen?"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">Dieser Name wird im Koran-Plan angezeigt.</p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium animate-fade-in ${message.includes('Fehler') ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'}`}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-bold shadow-md active:scale-95 transform"
            >
              {loading ? 'Speichert...' : <><Save size={20} /> Änderungen speichern</>}
            </button>
          </form>

          <div className="border-t border-gray-100 dark:border-gray-600 pt-6 space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Details</h4>
            
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Mail size={18} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm truncate">{user?.email}</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Hash size={18} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-mono truncate">{user?.id}</span>
            </div>
          </div>
          
          <button 
            onClick={() => signOut()}
            className="w-full mt-4 px-4 py-3 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}