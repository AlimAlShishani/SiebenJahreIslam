import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getSurahList, type SurahMeta } from '../lib/quranApi';
import { User, Save, Mail, Hash, Shield, Bookmark, BookOpen, Copy, ChevronDown, MessageSquare, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type SavedVerse = {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  arabic: string;
  translation: string;
  savedAt: string;
};

export default function Profile() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [openVerseId, setOpenVerseId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('quran-saved-verses');
      if (!raw) {
        setSavedVerses([]);
        return;
      }
      const parsed = JSON.parse(raw) as SavedVerse[] | unknown;
      if (!Array.isArray(parsed)) {
        setSavedVerses([]);
        return;
      }
      const cleaned = parsed.filter(
        (v: any): v is SavedVerse =>
          v &&
          typeof v.id === 'string' &&
          typeof v.surahNumber === 'number' &&
          typeof v.ayahNumber === 'number'
      );
      cleaned.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
      setSavedVerses(cleaned);
    } catch {
      setSavedVerses([]);
    }
  }, []);

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const list = await getSurahList();
        setSurahs(list);
      } catch {
        setSurahs([]);
      }
    };
    void loadSurahs();
  }, []);

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
      setMessage(t('profile.errorSaving') + ' ' + error.message);
    } else {
      setMessage(t('profile.successSaved'));
      // Kurze Verzögerung, dann Nachricht ausblenden
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-lg mx-auto pb-20">
      <h2 className="text-2xl font-bold text-center text-emerald-800 dark:text-emerald-200">{t('profile.title')}</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-emerald-100 dark:border-gray-600 overflow-hidden">
        {/* Header mit Avatar */}
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-6 flex flex-col items-center justify-center border-b border-emerald-100 dark:border-gray-600">
          <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-4xl font-bold shadow-sm mb-3 border-4 border-white dark:border-gray-800">
            {(fullName || user?.email || '?')[0].toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-gray-100">{fullName || t('profile.user')}</h3>
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
              <Shield size={20} /> {t('profile.toAdmin')}
            </Link>
          )}

          <Link
            to="/changelog"
            className="w-full bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-bold border border-gray-200 dark:border-gray-600"
          >
            <FileText size={20} /> {t('changelog.title', 'Changelog')}
          </Link>

          <Link
            to="/feedback"
            className="w-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 py-3 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-2 font-bold border border-emerald-200 dark:border-emerald-800"
          >
            <MessageSquare size={20} /> {t('profile.toFeedback')}
          </Link>

          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('profile.changeDisplayName')}</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t('profile.displayNamePlaceholder')}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">{t('profile.displayNameHint')}</p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium animate-fade-in ${message.startsWith(t('profile.errorSaving')) ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'}`}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-bold shadow-md active:scale-95 transform"
            >
              {loading ? t('profile.saving') : <><Save size={20} /> {t('profile.saveChanges')}</>}
            </button>
          </form>

          <div className="border-t border-gray-100 dark:border-gray-600 pt-6 space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Bookmark size={16} />
              {t('profile.savedVerses')}
            </h4>
            {savedVerses.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('profile.noVersesSaved')}
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {savedVerses.map((v) => {
                  const isOpen = openVerseId === v.id;
                  const isCopied = copiedId === v.id;
                  const surahMeta = surahs.find((s) => s.number === v.surahNumber);
                  const surahLabel = surahMeta?.englishName
                    ? `Surah ${surahMeta.englishName}`
                    : `Surah ${v.surahNumber}`;
                  return (
                    <div
                      key={v.id}
                      className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/70 p-3 space-y-2"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenVerseId(isOpen ? null : v.id)}
                        className="w-full flex items-center justify-between text-[11px] text-gray-700 dark:text-gray-200"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">
                            {surahLabel}, {t('common.verse')} {v.ayahNumber}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {t('common.page')} {v.pageNumber} • {new Date(v.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="pt-2 space-y-2">
                          <p className="font-quran text-lg leading-relaxed text-gray-900 dark:text-gray-100 text-center" dir="rtl">
                            {v.arabic}
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 text-center">
                            {v.translation || (
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                {t('profile.noTranslation')}
                              </span>
                            )}
                          </p>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                navigate(
                                  `/quran/read?slot=saved&startPage=${v.pageNumber}&surah=${v.surahNumber}&ayah=${v.ayahNumber}`
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border bg-white/80 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                            >
                              <BookOpen size={12} />
                              <span>{t('profile.openInReader')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const textToCopy = `${v.arabic}\n\n${v.translation}`;
                                try {
                                  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                                    await navigator.clipboard.writeText(textToCopy);
                                  } else if (typeof window !== 'undefined') {
                                    window.prompt('Text zum Kopieren:', textToCopy);
                                  }
                                  setCopiedId(v.id);
                                  if (typeof window !== 'undefined') {
                                    window.setTimeout(() => {
                                      setCopiedId((prev) => (prev === v.id ? null : prev));
                                    }, 3000);
                                  }
                                } catch {
                                  // ignore
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border ${
                                isCopied
                                  ? 'bg-emerald-600 border-emerald-700 text-white'
                                  : 'bg-white/80 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <Copy size={12} />
                              <span>{isCopied ? t('profile.copied') : t('profile.copy')}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-600 pt-6 space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('profile.accountDetails')}</h4>
            
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Mail size={18} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm truncate">{user?.email}</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Hash size={18} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-mono truncate">{user?.id}</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            <Link to="/datenschutz" className="text-emerald-600 dark:text-emerald-400 hover:underline">
              {t('profile.privacyPolicy')}
            </Link>
          </p>

          <button 
            onClick={() => signOut()}
            className="w-full mt-4 px-4 py-3 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {t('profile.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}