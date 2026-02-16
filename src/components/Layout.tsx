import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-emerald-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold font-serif">Ramadan App</h1>
          <button onClick={signOut} className="p-2 hover:bg-emerald-700 rounded-full" title="Abmelden">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full md:relative md:border-t-0 md:bg-transparent md:mb-6">
        <div className="container mx-auto px-4">
          <ul className="flex justify-around md:justify-center md:gap-8 py-3">
            <li>
              <Link
                to="/"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                <BookOpen size={24} />
                <span className="text-xs mt-1">Koran</span>
              </Link>
            </li>
            <li>
              <Link
                to="/learn"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/learn') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                <GraduationCap size={24} />
                <span className="text-xs mt-1">Lernen</span>
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/profile') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                <User size={24} />
                <span className="text-xs mt-1">Profil</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};
