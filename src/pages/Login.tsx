import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Registrierung erfolgreich! Bitte überprüfe deine E-Mails.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-emerald-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-emerald-800">Willkommen</h2>
        <p className="text-center text-gray-500">Melde dich an oder registriere dich</p>
        
        {error && <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg">{error}</div>}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Passwort</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Laden...' : 'Anmelden'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full px-4 py-2 text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
            >
              Registrieren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
