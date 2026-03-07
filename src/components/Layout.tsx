import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, BookText, GraduationCap, User, LogOut, Moon, Sun, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useRecording } from '../context/RecordingContext';
import { changeLanguage } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { ensurePushSubscription } from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';
export const Layout = () => {
  const { t, i18n } = useTranslation();
  const { signOut, user } = useAuth();
  const { isRecording } = useRecording();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const keepAliveCtxRef = useRef<AudioContext | null>(null);
  const keepAliveSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [showStreakInfo, setShowStreakInfo] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const hideMobileChromeForReader = location.pathname.startsWith('/quran/read');

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (!isRecording) return;
    e.preventDefault();
    if (window.confirm(t('audio.confirmLeaveRecording'))) {
      navigate(to);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void ensurePushSubscription(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setDailyStreak(0);
      return;
    }

    const toLocalDateKey = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const effectiveDateFromTimestamp = (iso: string) => {
      const dt = new Date(iso);
      if (dt.getHours() < 2) {
        dt.setDate(dt.getDate() - 1);
      }
      return dt;
    };

    const loadStreak = async () => {
      const lookbackStart = new Date();
      lookbackStart.setDate(lookbackStart.getDate() - 120);
      lookbackStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('quran_instance_tracking')
        .select('started_at, ayahs_read')
        .eq('user_id', user.id)
        .gte('started_at', lookbackStart.toISOString());

      if (error || !data) {
        setDailyStreak(0);
        return;
      }

      const ayahsByDay = new Map<string, number>();
      for (const row of data as { started_at: string; ayahs_read: number | null }[]) {
        const key = toLocalDateKey(effectiveDateFromTimestamp(row.started_at));
        ayahsByDay.set(key, (ayahsByDay.get(key) ?? 0) + Math.max(0, row.ayahs_read ?? 0));
      }

      const now = new Date();
      const effectiveToday = new Date(now);
      if (effectiveToday.getHours() < 2) effectiveToday.setDate(effectiveToday.getDate() - 1);

      const todayKey = toLocalDateKey(effectiveToday);
      const todayDone = (ayahsByDay.get(todayKey) ?? 0) >= 3;

      const cursor = new Date(effectiveToday);
      if (!todayDone) cursor.setDate(cursor.getDate() - 1);

      let streak = 0;
      while (streak < 365) {
        const key = toLocalDateKey(cursor);
        if ((ayahsByDay.get(key) ?? 0) < 3) break;
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      setDailyStreak(streak);
    };

    void loadStreak();
  }, [user?.id, location.pathname]);

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
      <header className={`bg-emerald-600 dark:bg-emerald-800 text-white shadow-md ${hideMobileChromeForReader ? 'max-md:hidden' : ''}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold font-serif">Nuruna</h1>
          <div className="flex items-center gap-1 relative">
            <button
              type="button"
              onClick={() => setShowStreakInfo((v) => !v)}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-700/70 dark:bg-emerald-900/70 hover:bg-emerald-700 dark:hover:bg-emerald-900 rounded-lg transition-colors border border-emerald-500/50"
              title={t('common.dailyStreakTitle')}
            >
              <Flame size={14} className="text-amber-300" />
              <span className="text-sm font-semibold">{dailyStreak}</span>
            </button>
            {showStreakInfo && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
                <p className="text-sm font-semibold">{t('common.dailyStreakTitle')}</p>
                <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">{t('common.dailyStreakInfo')}</p>
              </div>
            )}
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value as 'de' | 'en' | 'ru' | 'tr')}
              className="flex items-center gap-1 px-2 py-1.5 bg-transparent hover:bg-emerald-700 dark:hover:bg-emerald-900 rounded-lg transition-colors font-medium text-sm cursor-pointer border border-emerald-500/50"
              title="Sprache"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="tr">Türkçe</option>
            </select>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-emerald-700 dark:hover:bg-emerald-900 rounded-full transition-colors"
              title={theme === 'dark' ? t('common.light') : t('common.dark')}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={signOut} className="p-2 hover:bg-emerald-700 dark:hover:bg-emerald-900 rounded-full" title={t('common.logout')}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-grow container mx-auto px-4 md:py-6 ${hideMobileChromeForReader ? 'pt-0 pb-0 md:pb-24' : 'pt-0 pb-24 md:pb-24'}`}>
        <Outlet />
      </main>

      <nav className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-50 w-full ${hideMobileChromeForReader ? 'max-md:hidden' : ''}`}>
        <div className="container mx-auto px-4">
          <ul className="flex justify-around md:justify-center md:gap-8 py-3">
            <li>
              <Link
                to="/hatim"
                onClick={(e) => handleNavClick(e as React.MouseEvent<HTMLAnchorElement>, '/hatim')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/hatim') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <BookOpen size={24} />
                <span className="text-xs mt-1">{t('nav.hatim')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/quran"
                onClick={(e) => handleNavClick(e as React.MouseEvent<HTMLAnchorElement>, '/quran')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/quran') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <BookText size={24} />
                <span className="text-xs mt-1">{t('nav.quran')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/learn"
                onClick={(e) => handleNavClick(e as React.MouseEvent<HTMLAnchorElement>, '/learn')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/learn') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <GraduationCap size={24} />
                <span className="text-xs mt-1">{t('nav.learn')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                onClick={(e) => handleNavClick(e as React.MouseEvent<HTMLAnchorElement>, '/profile')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/profile') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <User size={24} />
                <span className="text-xs mt-1">{t('nav.profile')}</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};
