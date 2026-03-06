import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, BookText, Moon, Sparkles, Plus, Trash2, Pencil, Hourglass } from 'lucide-react';
import { getSurahList, type SurahMeta } from '../lib/quranApi';
import { getKahfWindow, isKahfWindowActiveSync, getKahfRemainingMsSync } from '../lib/maghrib';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { goalToPageRange, formatGoalLabel, calculatePageProgress, calculateKahfProgress, encodeAyaRef, type GoalRange, type GoalUnit } from '../lib/readingGoal';

const CUSTOM_SLOTS_STORAGE_KEY = 'quran-reader-custom-slots';
const GOAL_UNITS: { value: GoalUnit; labelKey: string }[] = [
  { value: 'juz', labelKey: 'goalUnitJuz' },
  { value: 'page', labelKey: 'goalUnitPage' },
  { value: 'aya', labelKey: 'goalUnitAya' },
];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEffectiveToday(): Date {
  const now = new Date();
  if (now.getHours() < 2) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }
  return now;
}
const FREE_LABEL_STORAGE_KEY = 'quran-reader-free-label';
const FREE_THEME_STORAGE_KEY = 'quran-reader-free-theme';
const LAST_LOCATION_PREFIX = 'quran-reader-last-location-';

export type InstanceTheme = 'green' | 'purple' | 'blue' | 'gold';
const THEMES: InstanceTheme[] = ['green', 'purple', 'blue', 'gold'];

type LastLocation = {
  page?: number;
  surah?: number;
  ayah?: number;
  juz?: number;
};

export interface QuranReaderSlot {
  id: string;
  label: string;
  theme: InstanceTheme;
  createdAt: number;
  expiresAt: number | null;
  goal?: GoalRange;
  goalStartPage?: number;
  goalEndPage?: number;
}

function loadCustomSlots(): QuranReaderSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_SLOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const slots = parsed
      .filter((item: any) => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.label === 'string')
      .map((item: any) => {
        const goal = item.goal && typeof item.goal === 'object' && Number.isFinite(item.goal.from) && Number.isFinite(item.goal.to) && ['juz', 'page', 'aya'].includes(item.goal.unit)
          ? { from: item.goal.from, to: item.goal.to, unit: item.goal.unit as GoalUnit }
          : undefined;
        return {
          id: item.id,
          label: item.label,
          theme: THEMES.includes(item.theme) ? item.theme : 'green',
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0,
          expiresAt: typeof item.expiresAt === 'number' ? item.expiresAt : null,
          goal,
          goalStartPage: Number.isFinite(item.goalStartPage) ? item.goalStartPage : undefined,
          goalEndPage: Number.isFinite(item.goalEndPage) ? item.goalEndPage : undefined,
        };
      })
      .filter((s) => s.expiresAt === null || s.expiresAt > now);
    if (slots.length < parsed.length) {
      try {
        window.localStorage.setItem(CUSTOM_SLOTS_STORAGE_KEY, JSON.stringify(slots));
      } catch {
        // ignore
      }
    }
    return slots;
  } catch {
    return [];
  }
}

function saveCustomSlots(slots: QuranReaderSlot[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOM_SLOTS_STORAGE_KEY, JSON.stringify(slots));
  } catch {
    // ignore
  }
}

function getLastLocation(slotId: string): LastLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${LAST_LOCATION_PREFIX}${slotId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastLocation;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function clearKahfLastLocation() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`${LAST_LOCATION_PREFIX}kahf`);
  } catch {
    // ignore
  }
}


function getFreeTheme(): InstanceTheme {
  if (typeof window === 'undefined') return 'green';
  const t = window.localStorage.getItem(FREE_THEME_STORAGE_KEY);
  return THEMES.includes(t as InstanceTheme) ? (t as InstanceTheme) : 'green';
}

function formatRemaining(expiresAt: number | null, t: (k: string) => string): string {
  if (expiresAt === null) return t('quranMenu.infinite');
  const ms = expiresAt - Date.now();
  if (ms <= 0) return t('quranMenu.expired');
  const totalMinutes = Math.floor(ms / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const months = Math.floor(totalDays / 30);
  const days = totalDays - months * 30;
  const hours = totalHours - totalDays * 24;
  const minutes = totalMinutes - totalHours * 60;
  if (totalDays >= 1) return `${months}m ${days}d ${hours}h`;
  if (totalHours >= 1) return `${totalHours}h ${minutes}m`;
  if (totalMinutes >= 1) return `${totalMinutes}m`;
  return '<1m';
}

/** Verbleibende Zeit nur in Stunden und Minuten (für Kahf). */
function formatRemainingKahf(expiresAt: number | null, t: (k: string) => string): string {
  if (expiresAt === null) return t('quranMenu.infinite');
  const ms = expiresAt - Date.now();
  if (ms <= 0) return t('quranMenu.expired');
  const totalMinutes = Math.floor(ms / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - totalHours * 60;
  if (totalHours >= 1) return `${totalHours}h ${minutes}m`;
  if (totalMinutes >= 1) return `${totalMinutes}m`;
  return '<1m';
}

function themeGradient(theme: InstanceTheme): string {
  switch (theme) {
    case 'green':
      return 'from-emerald-500/95 to-emerald-700/95 dark:from-emerald-600/95 dark:to-emerald-800/95';
    case 'purple':
      return 'from-violet-500/95 to-indigo-700/95 dark:from-violet-600/95 dark:to-indigo-800/95';
    case 'blue':
      return 'from-sky-500/95 to-blue-700/95 dark:from-sky-600/95 dark:to-blue-800/95';
    case 'gold':
      return 'from-amber-400/95 via-amber-500/95 to-yellow-600/95 dark:from-amber-500/95 dark:to-amber-700/95';
    default:
      return 'from-emerald-500/95 to-emerald-700/95';
  }
}

export default function QuranMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customSlots, setCustomSlots] = useState<QuranReaderSlot[]>(loadCustomSlots);
  const [freeLabel, setFreeLabel] = useState(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(FREE_LABEL_STORAGE_KEY) : null;
    return stored || t('quranMenu.freeLabelDefault');
  });
  const [freeTheme, setFreeTheme] = useState<InstanceTheme>(getFreeTheme);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotTheme, setNewSlotTheme] = useState<InstanceTheme>('green');
  const [newSlotMonths, setNewSlotMonths] = useState('');
  const [newSlotWeeks, setNewSlotWeeks] = useState('');
  const [newSlotDays, setNewSlotDays] = useState('');
  const [newSlotHours, setNewSlotHours] = useState('');
  const [newSlotInfinite, setNewSlotInfinite] = useState(true);
  const [newSlotHasGoal, setNewSlotHasGoal] = useState(false);
  const [newSlotGoalFrom, setNewSlotGoalFrom] = useState('');
  const [newSlotGoalTo, setNewSlotGoalTo] = useState('');
  const [newSlotGoalUnit, setNewSlotGoalUnit] = useState<GoalUnit>('juz');
  const [newSlotGoalFromSurah, setNewSlotGoalFromSurah] = useState<number>(1);
  const [newSlotGoalToSurah, setNewSlotGoalToSurah] = useState<number>(1);
  const [newSlotGoalFromAyah, setNewSlotGoalFromAyah] = useState<number>(1);
  const [newSlotGoalToAyah, setNewSlotGoalToAyah] = useState<number>(1);

  const { user } = useAuth();
  const todayStr = toLocalDateString(getEffectiveToday());
  const [hatimAssignment, setHatimAssignment] = useState<{ start_page: number; end_page: number; juz_number: number } | null>(null);

  useEffect(() => {
    getSurahList().then(setSurahs).catch(() => setSurahs([]));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setHatimAssignment(null);
      return;
    }
    let mounted = true;
    (async () => {
      const { data: membership } = await supabase
        .from('reading_group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .maybeSingle();
      const gid = membership?.group_id;
      if (!gid) {
        if (mounted) setHatimAssignment(null);
        return;
      }
      const { data: assignment } = await supabase
        .from('daily_reading_status')
        .select('start_page, end_page, juz_number')
        .eq('group_id', gid)
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .maybeSingle();
      if (mounted && assignment) {
        setHatimAssignment({
          start_page: assignment.start_page,
          end_page: assignment.end_page,
          juz_number: assignment.juz_number ?? 1,
        });
      } else if (mounted) {
        setHatimAssignment(null);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, todayStr]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FREE_LABEL_STORAGE_KEY, freeLabel);
  }, [freeLabel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FREE_THEME_STORAGE_KEY, freeTheme);
  }, [freeTheme]);

  const lastFree = getLastLocation('free');
  const lastKahf = getLastLocation('kahf');
  const lastHatim = getLastLocation('hatim');
  const surahName = (surahNum: number) => surahs.find((s) => s.number === surahNum)?.englishName ?? `Sure ${surahNum}`;

  const removeSlot = (id: string) => {
    const updated = customSlots.filter((s) => s.id !== id);
    setCustomSlots(updated);
    saveCustomSlots(updated);
  };

  const updateSlotLabel = (id: string, label: string) => {
    const updated = customSlots.map((s) => (s.id === id ? { ...s, label } : s));
    setCustomSlots(updated);
    saveCustomSlots(updated);
    setEditingLabelId(null);
  };

  const updateSlotTheme = (id: string, theme: InstanceTheme) => {
    const updated = customSlots.map((s) => (s.id === id ? { ...s, theme } : s));
    setCustomSlots(updated);
    saveCustomSlots(updated);
  };

  const saveNewSlot = async () => {
    const label = (newSlotLabel || t('quranMenu.slotPlaceholder', { n: customSlots.length + 2 })).trim();
    let expiresAt: number | null = null;
    if (!newSlotInfinite) {
      const months = Math.max(0, parseInt(newSlotMonths, 10) || 0);
      const weeks = Math.max(0, parseInt(newSlotWeeks, 10) || 0);
      const days = Math.max(0, parseInt(newSlotDays, 10) || 0);
      const hours = Math.max(0, parseInt(newSlotHours, 10) || 0);
      const totalMs =
        months * 30 * 24 * 60 * 60 * 1000 +
        weeks * 7 * 24 * 60 * 60 * 1000 +
        days * 24 * 60 * 60 * 1000 +
        hours * 60 * 60 * 1000;
      if (totalMs > 0) expiresAt = Date.now() + totalMs;
    }
    let goal: GoalRange | undefined;
    let goalStartPage: number | undefined;
    let goalEndPage: number | undefined;
    if (newSlotHasGoal) {
      let from: number;
      let to: number;
      if (newSlotGoalUnit === 'aya') {
        from = encodeAyaRef(newSlotGoalFromSurah, newSlotGoalFromAyah);
        to = encodeAyaRef(newSlotGoalToSurah, newSlotGoalToAyah);
      } else {
        const fromNum = parseInt(newSlotGoalFrom, 10);
        const toNum = parseInt(newSlotGoalTo, 10);
        if (!Number.isFinite(fromNum) || !Number.isFinite(toNum) || fromNum > toNum) {
          from = 0;
          to = 0;
        } else {
          from = fromNum;
          to = toNum;
        }
      }
      if (from > 0 && to > 0 && from <= to) {
        goal = { from, to, unit: newSlotGoalUnit };
        const range = await goalToPageRange(goal);
        if (range) {
          goalStartPage = range.startPage;
          goalEndPage = range.endPage;
        }
      }
    }
    const next: QuranReaderSlot = {
      id: crypto.randomUUID(),
      label,
      theme: newSlotTheme,
      createdAt: Date.now(),
      expiresAt,
      goal,
      goalStartPage,
      goalEndPage,
    };
    const updated = [...customSlots, next];
    setCustomSlots(updated);
    saveCustomSlots(updated);
    setShowAddForm(false);
    setNewSlotLabel('');
    setNewSlotTheme('green');
    setNewSlotMonths('');
    setNewSlotWeeks('');
    setNewSlotDays('');
    setNewSlotHours('');
    setNewSlotInfinite(true);
    setNewSlotHasGoal(false);
    setNewSlotGoalFrom('');
    setNewSlotGoalTo('');
    setNewSlotGoalUnit('juz');
    setNewSlotGoalFromSurah(1);
    setNewSlotGoalToSurah(1);
    setNewSlotGoalFromAyah(1);
    setNewSlotGoalToAyah(1);
    const urlParams = new URLSearchParams({ slot: next.id });
    if (goalStartPage != null && goalEndPage != null) {
      urlParams.set('startPage', String(goalStartPage));
      urlParams.set('endPage', String(goalEndPage));
    }
    navigate(`/quran/read?${urlParams.toString()}`);
  };

  const statusLine = (slotId: string) => {
    const loc = getLastLocation(slotId);
    if (!loc?.surah || !loc?.ayah) return null;
    const left = `${surahName(loc.surah)} : ${loc.ayah}`;
    const page = loc.page ?? '?';
    const juz = loc.juz ?? '?';
    const right = `${t('quranMenu.page')} ${page} | ${t('quranMenu.juz')} ${juz}`;
    return { left, right };
  };

  const [kahfActive, setKahfActive] = useState(false);
  const [kahfWindow, setKahfWindow] = useState<{ startDay: number; startTime: string; endDay: number; endTime: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const cfg = await getKahfWindow();
      if (!mounted) return;
      const active = isKahfWindowActiveSync(cfg);
      setKahfWindow(cfg);
      setKahfActive(active);
      if (!active) clearKahfLastLocation();
    };
    void check();
    const t = setInterval(check, 60_000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const ThemeIcon = ({ theme, className = 'w-12 h-12 opacity-25' }: { theme: InstanceTheme; className?: string }) => {
    switch (theme) {
      case 'green':
        return <BookText className={className} size={48} />;
      case 'purple':
        return <Moon className={className} size={48} />;
      case 'blue':
        return <Sparkles className={className} size={48} />;
      case 'gold':
        return <span className={`text-4xl opacity-30 ${className}`} aria-hidden>🕋</span>;
      default:
        return <BookText className={className} size={48} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-center text-emerald-800 dark:text-emerald-200">{t('quranMenu.title')}</h1>

        <div className="space-y-4">
          {/* Hatim Reader – immer Grün */}
          <Link
            to="/hatim?openReader=1"
            className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/95 to-emerald-700/95 dark:from-emerald-600/95 dark:to-emerald-800/95 shadow-lg hover:shadow-xl transition-shadow p-6 text-white"
          >
            <div className="absolute top-3 right-3 pointer-events-none">
              <BookOpen size={56} className="opacity-20" />
            </div>
            <div className="relative">
              <h2 className="font-bold text-xl text-white drop-shadow-sm">{t('quranMenu.hatimReader')}</h2>
              <p className="text-sm text-white/90 mt-0.5">{t('quranMenu.hatimDesc')}</p>
              {hatimAssignment && (
                <div className="mt-3 space-y-1.5">
                  <div className="text-sm text-white/95 font-medium">
                    {t('quranMenu.page')} {hatimAssignment.start_page}–{hatimAssignment.end_page}
                  </div>
                  {lastHatim?.page != null && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-white/30 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{
                            width: `${calculatePageProgress(
                              lastHatim.page,
                              hatimAssignment.start_page,
                              hatimAssignment.end_page
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/90">
                        {Math.round(
                          calculatePageProgress(
                            lastHatim.page,
                            hatimAssignment.start_page,
                            hatimAssignment.end_page
                          )
                        )}%
                      </span>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs text-white bg-black/80 rounded-lg px-2 py-1">
                    <Hourglass size={12} />
                    {t('quranMenu.infinite')}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Surah Kahf Licht – VON bis BIS aus Admin */}
          {kahfActive && (
            <Link
              to="/quran/read?slot=kahf&startPage=293&endPage=304"
              className="block relative overflow-hidden rounded-2xl shadow-lg border border-emerald-900/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 pointer-events-none" />
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-emerald-300/70 animate-kahf-float"
                    style={{
                      left: `${5 + (i % 7) * 14}%`,
                      top: `${8 + (i % 6) * 16}%`,
                      animationDelay: `${i * 0.25}s`,
                    }}
                  />
                ))}
              </div>
              <div className="relative p-6 text-white">
                <h2 className="font-bold text-xl drop-shadow-sm">{t('quranMenu.surahKahf')}</h2>
                <p className="text-sm text-emerald-200/90 mt-0.5">{t('quranMenu.kahfHadith')}</p>
                {lastKahf?.surah === 18 && lastKahf?.ayah ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between items-baseline gap-2 text-sm text-emerald-100/95">
                      <span>{lastKahf.ayah === 110 ? t('quranMenu.completed') : `Al-Kahf : ${lastKahf.ayah}`}</span>
                      <span className="shrink-0">{t('quranMenu.page')} {lastKahf.page ?? '?'}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-white/30 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{
                            width: `${calculateKahfProgress(lastKahf.ayah)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-emerald-100/90">
                        {Math.round(calculateKahfProgress(lastKahf.ayah))}%
                      </span>
                    </div>
                    {kahfWindow && (() => {
                      const remaining = getKahfRemainingMsSync(kahfWindow);
                      if (remaining === null) return null;
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs text-white bg-black/80 rounded-lg px-2 py-1">
                          <Hourglass size={12} />
                          {formatRemainingKahf(Date.now() + remaining, t)}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex justify-between items-center gap-2 mt-2">
                    {kahfWindow && (() => {
                      const remaining = getKahfRemainingMsSync(kahfWindow);
                      if (remaining === null) return null;
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs text-white bg-black/80 rounded-lg px-2 py-1 shrink-0">
                          <Hourglass size={12} />
                          {formatRemainingKahf(Date.now() + remaining, t)}
                        </span>
                      );
                    })()}
                    <p className="text-sm text-emerald-200/80 ml-auto">{t('quranMenu.notReadYet')}</p>
                  </div>
                )}
              </div>
            </Link>
          )}

          {/* Free slot – wählbares Design */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600">
            <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient(freeTheme)} pointer-events-none`} />
            <div className="absolute top-4 right-4 pointer-events-none text-white">
              <ThemeIcon theme={freeTheme} className="!w-14 !h-14 !opacity-20" />
            </div>
            <div className="relative p-6 text-white">
              <Link to="/quran/read?slot=free" className="block">
                <h2 className="font-bold text-xl drop-shadow-sm">{freeLabel}</h2>
                {lastFree?.surah && lastFree?.ayah ? (
                  <div className="flex justify-between items-baseline gap-2 mt-2 text-sm text-white/95">
                    <span>{surahName(lastFree.surah)} : {lastFree.ayah}</span>
                    <span className="shrink-0">{t('quranMenu.page')} {lastFree.page ?? '?'} | {t('quranMenu.juz')} {lastFree.juz ?? '?'}</span>
                  </div>
                ) : (
                  <p className="text-sm text-white/80 mt-1">{t('quranMenu.notReadYet')}</p>
                )}
              </Link>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setEditingLabelId('free'); setEditingLabelValue(freeLabel); }}
                  className="p-2 rounded-lg text-white/90 hover:bg-white/20"
                  aria-label={t('quranMenu.edit')}
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>
            {editingLabelId === 'free' && (
              <div className="relative px-6 pb-4 space-y-3">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingLabelValue}
                    onChange={(e) => setEditingLabelValue(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    placeholder={t('quranMenu.slotName')}
                  />
                  <button
                    type="button"
                    onClick={() => { setFreeLabel(editingLabelValue.trim() || t('quranMenu.freeLabelDefault')); setEditingLabelId(null); }}
                    className="px-3 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30"
                  >
                    {t('quranMenu.save')}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80">{t('quranMenu.design')}:</span>
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFreeTheme(t); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${freeTheme === t ? 'border-white scale-110' : 'border-white/40 hover:border-white/70'}`}
                      style={{
                        background: t === 'green' ? 'linear-gradient(135deg, #10b981, #047857)' : t === 'purple' ? 'linear-gradient(135deg, #8b5cf6, #4338ca)' : t === 'blue' ? 'linear-gradient(135deg, #0ea5e9, #1d4ed8)' : 'linear-gradient(135deg, #fbbf24, #ca8a04)',
                      }}
                      aria-label={`Design ${t}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {customSlots.map((slot) => {
            const status = statusLine(slot.id);
            const isEditing = editingLabelId === slot.id;
            return (
              <div
                key={slot.id}
                className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient(slot.theme)} pointer-events-none`} />
                <div className="absolute top-4 right-4 pointer-events-none text-white">
                  <ThemeIcon theme={slot.theme} className="!w-14 !h-14 !opacity-20" />
                </div>
                <div className="relative p-6 text-white">
                  <Link to={`/quran/read?slot=${encodeURIComponent(slot.id)}`} className="block">
                    <h2 className="font-bold text-xl drop-shadow-sm">{slot.label}</h2>
                    {slot.goal && (
                      <div className="text-sm text-white/90 mt-1">{formatGoalLabel(slot.goal)}</div>
                    )}
                    {status ? (
                      <div className="flex justify-between items-baseline gap-2 mt-2 text-sm text-white/95">
                        <span>{status.left}</span>
                        <span className="shrink-0">{status.right}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-white/80 mt-1">{t('quranMenu.notReadYet')}</p>
                    )}
                    {slot.goalStartPage != null && slot.goalEndPage != null && (() => {
                      const loc = getLastLocation(slot.id);
                      const page = loc?.page ?? 0;
                      const pct = calculatePageProgress(page, slot.goalStartPage, slot.goalEndPage);
                      if (pct <= 0) return null;
                      return (
                        <div className="mt-1.5 space-y-1">
                          <div className="h-1.5 w-full rounded-full bg-white/30 overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full transition-all"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/90">{Math.round(pct)}%</span>
                        </div>
                      );
                    })()}
                    <span className="inline-flex items-center gap-1.5 text-xs text-white bg-black/80 rounded-lg px-2 py-1 mt-1">
                      <Hourglass size={12} />
                      {formatRemaining(slot.expiresAt, t)}
                    </span>
                  </Link>
                  <div className="mt-4 flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setEditingLabelId(slot.id); setEditingLabelValue(slot.label); }}
                      className="p-2 rounded-lg text-white/90 hover:bg-white/20"
                      aria-label={t('quranMenu.edit')}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeSlot(slot.id); }}
                      className="p-2 rounded-lg text-white/90 hover:bg-red-500/30"
                      aria-label={t('quranMenu.remove')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="relative px-6 pb-4 space-y-3 bg-black/10">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editingLabelValue}
                        onChange={(e) => setEditingLabelValue(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => updateSlotLabel(slot.id, editingLabelValue.trim() || slot.label)}
                        className="px-3 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30"
                      >
                        {t('quranMenu.save')}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/80">{t('quranMenu.design')}:</span>
                      {THEMES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => { e.preventDefault(); updateSlotTheme(slot.id, t); }}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${slot.theme === t ? 'border-white scale-110' : 'border-white/40 hover:border-white/70'}`}
                          style={{
                            background: t === 'green' ? 'linear-gradient(135deg, #10b981, #047857)' : t === 'purple' ? 'linear-gradient(135deg, #8b5cf6, #4338ca)' : t === 'blue' ? 'linear-gradient(135deg, #0ea5e9, #1d4ed8)' : 'linear-gradient(135deg, #fbbf24, #ca8a04)',
                          }}
                          aria-label={`Design ${t}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {showAddForm ? (
            <div className="rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-600 bg-white dark:bg-gray-800 p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quranMenu.slotName')}
              </label>
              <input
                type="text"
                value={newSlotLabel}
                onChange={(e) => setNewSlotLabel(e.target.value)}
                placeholder={t('quranMenu.slotPlaceholder', { n: customSlots.length + 2 })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('quranMenu.design')}</div>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewSlotTheme(t)}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${newSlotTheme === t ? 'border-emerald-600 ring-2 ring-emerald-400' : 'border-gray-300 dark:border-gray-600'}`}
                    style={{
                      background: t === 'green' ? 'linear-gradient(135deg, #10b981, #047857)' : t === 'purple' ? 'linear-gradient(135deg, #8b5cf6, #4338ca)' : t === 'blue' ? 'linear-gradient(135deg, #0ea5e9, #1d4ed8)' : 'linear-gradient(135deg, #fbbf24, #ca8a04)',
                    }}
                    aria-label={`Design ${t}`}
                  />
                ))}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('quranMenu.deleteAfter')}</div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newSlotInfinite}
                  onChange={() => setNewSlotInfinite(true)}
                />
                <span>{t('quranMenu.infiniteUntilDelete')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!newSlotInfinite}
                  onChange={() => setNewSlotInfinite(false)}
                />
                <span>{t('quranMenu.timePeriod')}</span>
              </label>
              {!newSlotInfinite && (
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotMonths}
                      onChange={(e) => setNewSlotMonths(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    {t('quranMenu.months')}
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotWeeks}
                      onChange={(e) => setNewSlotWeeks(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    {t('quranMenu.weeks')}
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotDays}
                      onChange={(e) => setNewSlotDays(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    {t('quranMenu.days')}
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotHours}
                      onChange={(e) => setNewSlotHours(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    {t('quranMenu.hours')}
                  </span>
                </div>
              )}
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">{t('quranMenu.hasGoal')}</div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!newSlotHasGoal}
                  onChange={() => setNewSlotHasGoal(false)}
                />
                <span>{t('common.no')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newSlotHasGoal}
                  onChange={() => setNewSlotHasGoal(true)}
                />
                <span>{t('common.yes')}</span>
              </label>
              {newSlotHasGoal && (
                <div className="space-y-3">
                  <select
                    value={newSlotGoalUnit}
                    onChange={(e) => {
                      const u = e.target.value as GoalUnit;
                      setNewSlotGoalUnit(u);
                      if (u === 'aya') {
                        setNewSlotGoalFromSurah(1);
                        setNewSlotGoalToSurah(1);
                        setNewSlotGoalFromAyah(1);
                        setNewSlotGoalToAyah(1);
                      }
                    }}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm"
                  >
                    {GOAL_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{t(`quranMenu.${u.labelKey}`)}</option>
                    ))}
                  </select>
                  {(newSlotGoalUnit === 'juz' || newSlotGoalUnit === 'page') && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        type="number"
                        min={1}
                        value={newSlotGoalFrom}
                        onChange={(e) => setNewSlotGoalFrom(e.target.value)}
                        placeholder={t('quranMenu.goalFrom')}
                        className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500">–</span>
                      <input
                        type="number"
                        min={1}
                        value={newSlotGoalTo}
                        onChange={(e) => setNewSlotGoalTo(e.target.value)}
                        placeholder={t('quranMenu.goalTo')}
                        className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                  {newSlotGoalUnit === 'aya' && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-gray-500">{t('quranMenu.goalFrom')}:</span>
                      <select
                        value={newSlotGoalFromSurah}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setNewSlotGoalFromSurah(n);
                          const maxAyah = surahs.find((s) => s.number === n)?.ayahCount ?? 286;
                          if (newSlotGoalFromAyah > maxAyah) setNewSlotGoalFromAyah(maxAyah);
                        }}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm min-w-[7rem]"
                      >
                        {surahs.length === 0 ? (
                          <option value={1}>{t('common.loading')}</option>
                        ) : (
                          surahs.map((s) => (
                            <option key={s.number} value={s.number}>{s.number}. {s.englishName}</option>
                          ))
                        )}
                      </select>
                      <select
                        value={newSlotGoalFromAyah}
                        onChange={(e) => setNewSlotGoalFromAyah(Number(e.target.value))}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm w-16"
                      >
                        {Array.from({ length: surahs.find((s) => s.number === newSlotGoalFromSurah)?.ayahCount ?? 286 }, (_, i) => i + 1).map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <span className="text-gray-500">–</span>
                      <span className="text-xs text-gray-500">{t('quranMenu.goalTo')}:</span>
                      <select
                        value={newSlotGoalToSurah}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setNewSlotGoalToSurah(n);
                          const maxAyah = surahs.find((s) => s.number === n)?.ayahCount ?? 286;
                          if (newSlotGoalToAyah > maxAyah) setNewSlotGoalToAyah(maxAyah);
                        }}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm min-w-[7rem]"
                      >
                        {surahs.length === 0 ? (
                          <option value={1}>{t('common.loading')}</option>
                        ) : (
                          surahs.map((s) => (
                            <option key={s.number} value={s.number}>{s.number}. {s.englishName}</option>
                          ))
                        )}
                      </select>
                      <select
                        value={newSlotGoalToAyah}
                        onChange={(e) => setNewSlotGoalToAyah(Number(e.target.value))}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm w-16"
                      >
                        {Array.from({ length: surahs.find((s) => s.number === newSlotGoalToSurah)?.ayahCount ?? 286 }, (_, i) => i + 1).map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSlotLabel('');
                    setNewSlotTheme('green');
                    setNewSlotMonths('');
                    setNewSlotWeeks('');
                    setNewSlotDays('');
                    setNewSlotHours('');
                    setNewSlotInfinite(true);
                    setNewSlotHasGoal(false);
                    setNewSlotGoalFrom('');
                    setNewSlotGoalTo('');
                    setNewSlotGoalUnit('juz');
                    setNewSlotGoalFromSurah(1);
                    setNewSlotGoalToSurah(1);
                    setNewSlotGoalFromAyah(1);
                    setNewSlotGoalToAyah(1);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
                >
                  {t('quranMenu.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void saveNewSlot()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
                >
                  {t('quranMenu.createAndOpen')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Plus size={20} />
              <span>{t('quranMenu.newSlot')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
