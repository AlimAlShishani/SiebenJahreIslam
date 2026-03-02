import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, User, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DEBUG_REMOUNT =
  typeof window !== 'undefined' &&
  (new URLSearchParams(window.location.search).get('debugRemount') === '1' ||
    window.sessionStorage.getItem('debugRemount') === '1');

const logDebug = (...args: unknown[]) => {
  if (!DEBUG_REMOUNT) return;
  console.log('[debug-remount][Layout]', ...args);
};

export const Layout = () => {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const keepAliveCtxRef = useRef<AudioContext | null>(null);
  const keepAliveSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    logDebug('mounted', { path: location.pathname });
    return () => logDebug('unmounted', { path: location.pathname });
  }, []);

  useEffect(() => {
    if (!DEBUG_REMOUNT) return;
    window.sessionStorage.setItem('debugRemount', '1');
    const onVisibility = () => logDebug('visibilitychange', document.visibilityState);
    const onFocus = () => logDebug('window focus');
    const onBlur = () => logDebug('window blur');
    const onPageShow = () => logDebug('pageshow');
    const onPageHide = () => logDebug('pagehide');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  useEffect(() => {
    logDebug('route change', { path: location.pathname });
  }, [location.pathname]);

  useEffect(() => {
    const startKeepAliveAudio = () => {
      if (keepAliveCtxRef.current) return;
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.05)), ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(ctx.destination);
        source.start(0);
        keepAliveCtxRef.current = ctx;
        keepAliveSourceRef.current = source;
      } catch {
        // ignore
      }
    };

    const resumeAudioOnVisible = () => {
      if (document.visibilityState !== 'visible') return;
      try {
        keepAliveCtxRef.current?.resume();
      } catch {
        // ignore
      }
    };

    window.addEventListener('pointerdown', startKeepAliveAudio, { once: true });
    window.addEventListener('keydown', startKeepAliveAudio, { once: true });
    document.addEventListener('visibilitychange', resumeAudioOnVisible);
    return () => {
      window.removeEventListener('pointerdown', startKeepAliveAudio);
      window.removeEventListener('keydown', startKeepAliveAudio);
      document.removeEventListener('visibilitychange', resumeAudioOnVisible);
    };
  }, []);

  useLayoutEffect(() => {
    const key = `scroll:${location.pathname}`;
    const raw = window.sessionStorage.getItem(key);
    const y = raw ? Number(raw) : 0;
    if (!Number.isFinite(y) || y <= 0) return;

    // Bei Remount/Tab-Restore ist der Inhalt oft noch nicht voll gerendert.
    // Daher mehrmals versuchen, bis die Seite wieder die alte Höhe hat.
    const tryRestore = (remaining: number) => {
      const maxScrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(y, maxScrollable);
      window.scrollTo(0, target);
      if (remaining <= 0) return;
      window.requestAnimationFrame(() => tryRestore(remaining - 1));
    };
    tryRestore(12);

    const t = window.setTimeout(() => {
      const maxScrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, Math.min(y, maxScrollable));
    }, 300);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const key = `scroll:${location.pathname}`;
    const onScroll = () => {
      window.sessionStorage.setItem(key, String(window.scrollY));
    };
    const onPageHide = () => {
      window.sessionStorage.setItem(key, String(window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      <header className="bg-emerald-600 dark:bg-emerald-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold font-serif">Ramadan App</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-emerald-700 dark:hover:bg-emerald-900 rounded-full transition-colors"
              title={theme === 'dark' ? 'Hell' : 'Dunkel'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={signOut} className="p-2 hover:bg-emerald-700 dark:hover:bg-emerald-900 rounded-full" title="Abmelden">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 w-full md:relative md:border-t-0 md:bg-transparent md:mb-6 dark:md:bg-transparent">
        <div className="container mx-auto px-4">
          <ul className="flex justify-around md:justify-center md:gap-8 py-3">
            <li>
              <Link
                to="/"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
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
                  isActive('/learn') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
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
                  isActive('/profile') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
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
