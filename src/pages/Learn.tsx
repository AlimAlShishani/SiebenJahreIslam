import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Type, Star, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const isDebugRemount = () =>
  typeof window !== 'undefined' &&
  (new URLSearchParams(window.location.search).get('debugRemount') === '1' ||
    window.sessionStorage.getItem('debugRemount') === '1');

const logDebug = (...args: unknown[]) => {
  if (!isDebugRemount()) return;
  console.log('[debug-remount][Learn]', ...args);
};

interface LearningLevel {
  id: number;
  level_number: number;
  title: string;
  description: string | null;
}

type LearnPageCache = {
  userId: string | null;
  levels: LearningLevel[];
  itemIdsByLevel: Record<number, string[]>;
  completedItemIds: Set<string>;
};

type LearnPageCacheStorage = {
  userId: string | null;
  levels: LearningLevel[];
  itemIdsByLevel: Record<number, string[]>;
  completedItemIds: string[];
};

const LEARN_CACHE_KEY = 'learn_page_cache_v1';

const readLearnPageCache = (): LearnPageCache | null => {
  try {
    const raw = window.sessionStorage.getItem(LEARN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LearnPageCacheStorage;
    return {
      userId: parsed.userId ?? null,
      levels: Array.isArray(parsed.levels) ? parsed.levels : [],
      itemIdsByLevel: parsed.itemIdsByLevel ?? {},
      completedItemIds: new Set(parsed.completedItemIds ?? []),
    };
  } catch {
    return null;
  }
};

let learnPageCache: LearnPageCache | null = typeof window !== 'undefined' ? readLearnPageCache() : null;

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cachedForUser = learnPageCache?.userId === (user?.id ?? null) ? learnPageCache : null;
  const [levels, setLevels] = useState<LearningLevel[]>(() => cachedForUser?.levels ?? []);
  const [itemIdsByLevel, setItemIdsByLevel] = useState<Record<number, string[]>>(() => cachedForUser?.itemIdsByLevel ?? {});
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(() => cachedForUser?.completedItemIds ?? new Set());
  const [loading, setLoading] = useState(() => !cachedForUser);

  useEffect(() => {
    logDebug('mounted');
    return () => logDebug('unmounted');
  }, []);

  useEffect(() => {
    logDebug('loading changed', loading);
  }, [loading]);

  useEffect(() => {
    const fetch = async () => {
      const hasCache = learnPageCache?.userId === (user?.id ?? null);
      logDebug('fetch start', { userId: user?.id ?? null, hasCache });
      if (!hasCache) setLoading(true);
      const [levelsRes, itemsRes, progressRes] = await Promise.all([
        supabase.from('learning_levels').select('id, level_number, title, description').order('level_number'),
        supabase.from('learning_items').select('id, level_id'),
        user
          ? supabase.from('user_progress').select('item_id').eq('user_id', user.id).eq('is_completed', true)
          : { data: [] as { item_id: string }[], error: null },
      ]);
      if (levelsRes.error) console.error('Error fetching levels:', levelsRes.error);
      else setLevels(levelsRes.data || []);
      const byLevel: Record<number, string[]> = {};
      (itemsRes.data || []).forEach((row: { id: string; level_id: number }) => {
        if (!byLevel[row.level_id]) byLevel[row.level_id] = [];
        byLevel[row.level_id].push(row.id);
      });
      setItemIdsByLevel(byLevel);
      if (progressRes.data) {
        setCompletedItemIds(new Set((progressRes.data as { item_id: string }[]).map((r) => r.item_id)));
      } else {
        setCompletedItemIds(new Set());
      }
      learnPageCache = {
        userId: user?.id ?? null,
        levels: levelsRes.data || [],
        itemIdsByLevel: byLevel,
        completedItemIds: new Set((progressRes.data as { item_id: string }[] | null)?.map((r) => r.item_id) ?? []),
      };
      try {
        window.sessionStorage.setItem(
          LEARN_CACHE_KEY,
          JSON.stringify({
            userId: learnPageCache.userId,
            levels: learnPageCache.levels,
            itemIdsByLevel: learnPageCache.itemIdsByLevel,
            completedItemIds: Array.from(learnPageCache.completedItemIds),
          } satisfies LearnPageCacheStorage)
        );
      } catch {
        // ignore sessionStorage errors
      }
      setLoading(false);
      logDebug('fetch end', {
        userId: user?.id ?? null,
        levelsCount: (levelsRes.data || []).length,
      });
    };
    fetch();
  }, [user?.id]);

  const levelCompleted = useMemo(() => {
    const out: Record<number, boolean> = {};
    Object.keys(itemIdsByLevel).forEach((k) => {
      const num = Number(k);
      const ids = itemIdsByLevel[num] || [];
      if (ids.length === 0) out[num] = true;
      else out[num] = ids.every((id) => completedItemIds.has(id));
    });
    return (n: number) => !!out[n];
  }, [itemIdsByLevel, completedItemIds]);

  const levelUnlocked = useMemo(() => {
    return (n: number) => n === 1 || levelCompleted(n - 1);
  }, [levelCompleted]);

  if (loading) {
    return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Laden...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Lernbereich</h2>

      {/* Buchstaben-Übersicht (statische Seite) */}
      <div
        onClick={() => navigate('/learn/alphabet')}
        className="block group cursor-pointer"
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">
                Übersicht
              </span>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                Buchstaben – Schreibweisen
              </h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Alle Buchstaben: alleine, Anfang, Mitte, Ende
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
            <Type size={24} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-4" />

      {/* Stufen aus DB – nächste nur nach Bestehen der vorherigen */}
      <div className="grid grid-cols-1 gap-4">
        {levels.map((level) => {
          const unlocked = levelUnlocked(level.level_number);
          const completed = levelCompleted(level.level_number);
          return (
            <div
              key={level.id}
              onClick={() => unlocked && navigate(`/learn/${level.level_number}`)}
              className={`block group ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div
                className={`p-5 rounded-xl shadow-sm border flex items-center justify-between transition-all ${
                  unlocked
                    ? 'bg-white dark:bg-gray-800 border-emerald-100 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        completed
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                          : unlocked
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Stufe {level.level_number}
                    </span>
                    <h3
                      className={`text-lg font-semibold ${
                        unlocked
                          ? 'text-gray-800 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {level.title}
                    </h3>
                    {completed && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ geschafft</span>
                    )}
                  </div>
                  {level.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{level.description}</p>
                  )}
                  {!unlocked && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Schließe zuerst Stufe {level.level_number - 1} ohne alle Leben zu verlieren ab.
                    </p>
                  )}
                </div>
                <div
                  className={`p-3 rounded-full transition-colors ${
                    unlocked
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {unlocked ? (
                    <Star size={22} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock size={22} className="text-gray-400 dark:text-gray-500" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
