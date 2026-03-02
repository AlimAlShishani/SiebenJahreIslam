import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronUp, Loader2, Mic, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ReadingAudioCell } from '../components/ReadingAudioCell';
import {
  getAyahPosition,
  getDefaultTranslationEdition,
  getTranslationEditions,
  getJuzStartPage,
  getQuranPage,
  getSurahList,
  type QuranPageData,
  type ReaderMode,
  type SurahMeta,
  type TranslationEdition,
} from '../lib/quranApi';

interface AssignmentForReader {
  id: string;
  user_id: string;
  start_page: number;
  end_page: number;
  audio_url: string | null;
  audio_urls?: string[] | null;
}

const ARABIC_SUKOON = '\u0652';
const QURANIC_SUKOON = '\u06E1';
const SMALL_HIGH_ROUNDED_ZERO = '\u06DF';
const MADD_LETTERS = new Set(['ا', 'و', 'ي', 'ى']);

function isArabicCombiningMark(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return (
    (cp >= 0x064B && cp <= 0x065F) ||
    cp === 0x0670 ||
    (cp >= 0x06D6 && cp <= 0x06ED)
  );
}

function getPreviousBaseChar(text: string, idx: number): string | null {
  for (let i = idx - 1; i >= 0; i--) {
    const ch = text[i];
    if (!isArabicCombiningMark(ch)) return ch;
  }
  return null;
}

function toQuranicSukoon(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // Spezieller Mushaf-Fall: Madd-Buchstabe + U+06DF (۟)
    // soll visuell als arabisches Sukoon erscheinen.
    if (ch === SMALL_HIGH_ROUNDED_ZERO) {
      const prevBase = getPreviousBaseChar(text, i);
      if (prevBase && MADD_LETTERS.has(prevBase)) {
        out += ARABIC_SUKOON;
        continue;
      }
      out += ch;
      continue;
    }

    // Alle "normalen" Sukoon-Zeichen aus API als quranisches Sukoon rendern.
    if (ch === ARABIC_SUKOON) {
      out += QURANIC_SUKOON;
      continue;
    }

    out += ch;
  }
  return out;
}

function normalizeAudioUrls(assignment: AssignmentForReader | null): string[] {
  if (!assignment) return [];
  if (Array.isArray(assignment.audio_urls) && assignment.audio_urls.length > 0) {
    return assignment.audio_urls;
  }
  return assignment.audio_url ? [assignment.audio_url] : [];
}

export default function QuranReader() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const assignmentId = searchParams.get('assignmentId');
  const assignmentStartPage = Number(searchParams.get('startPage') || 1);
  const assignmentEndPage = Number(searchParams.get('endPage') || 604);

  const [mode, setMode] = useState<ReaderMode>('arabic');
  const [script, setScript] = useState('quran-uthmani');
  const [translationEdition, setTranslationEdition] = useState(getDefaultTranslationEdition());
  const [translationOptions, setTranslationOptions] = useState<TranslationEdition[]>([]);
  const [fontSize, setFontSize] = useState(36);
  const [pageInput, setPageInput] = useState(() => String(Math.max(1, Math.min(604, assignmentStartPage || 1))));
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [mobileAudioOpen, setMobileAudioOpen] = useState(false);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [pendingVerseSelection, setPendingVerseSelection] = useState<'first' | 'last' | null>(null);
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, Math.min(604, assignmentStartPage || 1)));
  const [pageData, setPageData] = useState<QuranPageData | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingJump, setLoadingJump] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentForReader | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const inAssignmentRange = currentPage >= assignmentStartPage && currentPage <= assignmentEndPage;
  const hasAssignmentContext = !!assignmentId && !!assignment;
  const canEditAudio = !!user && !!assignment && (assignment.user_id === user.id || isAdmin);

  const ayahCountForSelectedSurah = useMemo(() => {
    const surah = surahs.find((s) => s.number === selectedSurah);
    return surah?.ayahCount || 1;
  }, [surahs, selectedSurah]);

  const translationLabels: Record<string, string> = {
    de: 'Deutsch',
    en: 'Englisch',
    tr: 'Türkisch',
    fr: 'Französisch',
    ur: 'Urdu',
    id: 'Indonesisch',
    es: 'Spanisch',
    ru: 'Russisch',
    it: 'Italienisch',
    nl: 'Niederländisch',
  };

  const groupedTranslations = useMemo(() => {
    const groups = new Map<string, TranslationEdition[]>();
    for (const opt of translationOptions) {
      const lang = opt.language || 'other';
      const list = groups.get(lang) ?? [];
      list.push(opt);
      groups.set(lang, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [translationOptions]);

  const settingsControls = (
    <div className="space-y-3">
      <label className="text-sm text-gray-600 dark:text-gray-300 block">
        Übersetzung
        <select
          value={translationEdition}
          onChange={(e) => setTranslationEdition(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          {groupedTranslations.map(([lang, items]) => (
            <optgroup key={lang} label={translationLabels[lang] || lang.toUpperCase()}>
              {items.map((opt) => (
                <option key={opt.identifier} value={opt.identifier}>
                  {opt.name || opt.englishName} ({opt.identifier})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="text-sm text-gray-600 dark:text-gray-300 block">
        Arabisch Schrift / Skript
        <select
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          <option value="quran-uthmani">Uthmani (Default)</option>
        </select>
      </label>
      <label className="text-sm text-gray-600 dark:text-gray-300 block">
        Schriftgröße
        <input
          type="range"
          min={18}
          max={56}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-600"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">{fontSize}px</span>
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Weitere Skripte können später ergänzt werden. Aktuell nutzt der Reader standardmäßig Uthmani.
      </p>
    </div>
  );

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [surahData, translationData] = await Promise.all([getSurahList(), getTranslationEditions()]);
        setSurahs(surahData);
        setTranslationOptions(translationData);
        if (translationData.some((item) => item.identifier === getDefaultTranslationEdition())) {
          setTranslationEdition(getDefaultTranslationEdition());
        } else if (translationData[0]) {
          setTranslationEdition(translationData[0].identifier);
        }
      } catch {
        setSurahs([]);
        setTranslationOptions([
          {
            identifier: getDefaultTranslationEdition(),
            language: 'de',
            name: 'Abu Rida',
            englishName: 'Abu Rida',
          },
        ]);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }
    const fetchRole = async () => {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setIsAdmin((data?.role ?? '') === 'admin');
    };
    fetchRole();
  }, [user?.id]);

  useEffect(() => {
    if (!assignmentId) {
      setAssignment(null);
      return;
    }
    const fetchAssignment = async () => {
      setLoadingAssignment(true);
      const { data, error } = await supabase
        .from('daily_reading_status')
        .select('id, user_id, start_page, end_page, audio_url, audio_urls')
        .eq('id', assignmentId)
        .single();
      if (error || !data) {
        setAssignment(null);
      } else {
        setAssignment(data as AssignmentForReader);
      }
      setLoadingAssignment(false);
    };
    fetchAssignment();
  }, [assignmentId]);

  useEffect(() => {
    let cancelled = false;
    const loadPage = async () => {
      setLoadingPage(true);
      setErrorMessage(null);
      try {
        const data = await getQuranPage(currentPage, translationEdition);
        if (cancelled) return;
        setPageData(data);
        setSelectedJuz(data.juzNumber);
      } catch {
        if (!cancelled) {
          setErrorMessage('Die Quran-Seite konnte gerade nicht geladen werden. Bitte gleich erneut versuchen.');
          setPageData(null);
        }
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    };
    loadPage();
    return () => {
      cancelled = true;
    };
  }, [currentPage, translationEdition]);

  useEffect(() => {
    if (!pageData?.verses.length) {
      setSelectedVerseKey(null);
      return;
    }
    let verseToSelect = pageData.verses[0];
    if (pendingVerseSelection === 'last') {
      verseToSelect = pageData.verses[pageData.verses.length - 1];
    } else if (pendingVerseSelection !== 'first') {
      const existing = selectedVerseKey ? pageData.verses.find((v) => v.key === selectedVerseKey) : null;
      if (existing) verseToSelect = existing;
    }
    setSelectedVerseKey(verseToSelect.key);
    setSelectedSurah(verseToSelect.surahNumber);
    setSelectedAyah(verseToSelect.ayahNumber);
    if (pendingVerseSelection) setPendingVerseSelection(null);
  }, [pageData, pendingVerseSelection, selectedVerseKey]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (typeof window === 'undefined' || !window.matchMedia('(min-width: 768px)').matches) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        target?.isContentEditable ||
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        tag === 'button';
      if (isEditable || loadingPage || loadingJump || !pageData?.verses?.length) return;

      const verses = pageData.verses;
      const selectedIndex = selectedVerseKey ? verses.findIndex((v) => v.key === selectedVerseKey) : -1;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (selectedIndex < 0) {
          const first = verses[0];
          setSelectedVerseKey(first.key);
          setSelectedSurah(first.surahNumber);
          setSelectedAyah(first.ayahNumber);
          return;
        }
        if (selectedIndex < verses.length - 1) {
          const next = verses[selectedIndex + 1];
          setSelectedVerseKey(next.key);
          setSelectedSurah(next.surahNumber);
          setSelectedAyah(next.ayahNumber);
          return;
        }
        if (currentPage < 604) {
          setPendingVerseSelection('first');
          setCurrentPage((prev) => Math.min(604, prev + 1));
        }
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (selectedIndex < 0) {
          const last = verses[verses.length - 1];
          setSelectedVerseKey(last.key);
          setSelectedSurah(last.surahNumber);
          setSelectedAyah(last.ayahNumber);
          return;
        }
        if (selectedIndex > 0) {
          const prevVerse = verses[selectedIndex - 1];
          setSelectedVerseKey(prevVerse.key);
          setSelectedSurah(prevVerse.surahNumber);
          setSelectedAyah(prevVerse.ayahNumber);
          return;
        }
        if (currentPage > 1) {
          setPendingVerseSelection('last');
          setCurrentPage((prev) => Math.max(1, prev - 1));
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (mode === 'arabic') {
          setCurrentPage((prev) => Math.max(1, prev - 1));
        } else {
          setCurrentPage((prev) => Math.min(604, prev + 1));
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (mode === 'arabic') {
          setCurrentPage((prev) => Math.min(604, prev + 1));
        } else {
          setCurrentPage((prev) => Math.max(1, prev - 1));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPage, loadingJump, loadingPage, mode, pageData, selectedVerseKey]);

  const jumpToJuz = async (juzNumber: number) => {
    setLoadingJump(true);
    try {
      const page = await getJuzStartPage(juzNumber);
      setCurrentPage(page);
    } finally {
      setLoadingJump(false);
    }
  };

  const jumpToSurahAyah = async (surahNumber: number, ayahNumber: number) => {
    setLoadingJump(true);
    try {
      const position = await getAyahPosition(surahNumber, ayahNumber);
      setCurrentPage(position.pageNumber);
    } finally {
      setLoadingJump(false);
    }
  };

  const submitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    const next = Math.max(1, Math.min(604, Math.round(parsed)));
    setCurrentPage(next);
    setPageInput(String(next));
  };

  const appendAssignmentAudio = async (url: string) => {
    if (!assignment) return;
    const prev = normalizeAudioUrls(assignment);
    const next = [...prev, url];
    const { error } = await supabase
      .from('daily_reading_status')
      .update({
        audio_urls: next,
        audio_url: next[0] ?? null,
      })
      .eq('id', assignment.id);
    if (!error) {
      setAssignment((old) => (old ? { ...old, audio_urls: next, audio_url: next[0] ?? null } : old));
    }
  };

  const removeAssignmentAudio = async (url: string) => {
    if (!assignment) return;
    const prev = normalizeAudioUrls(assignment);
    const next = prev.filter((item) => item !== url);
    const { error } = await supabase
      .from('daily_reading_status')
      .update({
        audio_urls: next,
        audio_url: next[0] ?? null,
      })
      .eq('id', assignment.id);
    if (!error) {
      setAssignment((old) => (old ? { ...old, audio_urls: next, audio_url: next[0] ?? null } : old));
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div className="hidden md:block bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Quran Leser</h2>
            {hasAssignmentContext ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dein Part: Seite {assignmentStartPage} bis {assignmentEndPage}
                {!inAssignmentRange ? ' (du bist gerade außerhalb deines Bereichs)' : ''}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Freier Leser-Modus</p>
            )}
          </div>
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              type="button"
              onClick={() => setMode('arabic')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'arabic'
                  ? 'bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Arabisch
            </button>
            <button
              type="button"
              onClick={() => setMode('translation')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'translation'
                  ? 'bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Übersetzung
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Juz
            <select
              value={selectedJuz}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSelectedJuz(next);
                void jumpToJuz(next);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  Juz {j}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Surah
            <select
              value={selectedSurah}
              onChange={(e) => {
                const surah = Number(e.target.value);
                setSelectedSurah(surah);
                setSelectedAyah(1);
                void jumpToSurahAyah(surah, 1);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            >
              {surahs.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.englishName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Vers
            <select
              value={selectedAyah}
              onChange={(e) => {
                const ayah = Number(e.target.value);
                setSelectedAyah(ayah);
                void jumpToSurahAyah(selectedSurah, ayah);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            >
              {Array.from({ length: ayahCountForSelectedSurah }, (_, i) => i + 1).map((ayah) => (
                <option key={ayah} value={ayah}>
                  Vers {ayah}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
          {mode === 'arabic' ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(604, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage >= 604 || loadingJump}
              >
                <span className="inline-flex items-center gap-1">
                  Weiter <ArrowLeft size={14} />
                </span>
              </button>
              <input
                type="number"
                min={1}
                max={604}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={submitPageInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitPageInput();
                }}
                className="w-24 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                aria-label="Seite"
              />
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage <= 1 || loadingJump}
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowRight size={14} /> Zurück
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage <= 1 || loadingJump}
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Zurück
                </span>
              </button>
              <input
                type="number"
                min={1}
                max={604}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={submitPageInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitPageInput();
                }}
                className="w-24 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                aria-label="Seite"
              />
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(604, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage >= 604 || loadingJump}
              >
                <span className="inline-flex items-center gap-1">
                  Weiter <ArrowRight size={14} />
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile fixed top controls */}
      <div className="md:hidden fixed top-[72px] left-0 right-0 z-30 px-2">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-md bg-gray-100 dark:bg-gray-800 p-1">
              <button
                type="button"
                onClick={() => setMode('arabic')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  mode === 'arabic'
                    ? 'bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Arabisch
              </button>
              <button
                type="button"
                onClick={() => setMode('translation')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  mode === 'translation'
                    ? 'bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Übersetzung
              </button>
            </div>
            {hasAssignmentContext ? (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {assignmentStartPage}-{assignmentEndPage}
              </span>
            ) : (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Freier Modus</span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1">
            <select
              value={selectedJuz}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSelectedJuz(next);
                void jumpToJuz(next);
              }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-gray-100"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  J{j}
                </option>
              ))}
            </select>
            <select
              value={selectedSurah}
              onChange={(e) => {
                const surah = Number(e.target.value);
                setSelectedSurah(surah);
                setSelectedAyah(1);
                void jumpToSurahAyah(surah, 1);
              }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-gray-100"
            >
              {surahs.map((s) => (
                <option key={s.number} value={s.number}>
                  S{s.number}
                </option>
              ))}
            </select>
            <select
              value={selectedAyah}
              onChange={(e) => {
                const ayah = Number(e.target.value);
                setSelectedAyah(ayah);
                void jumpToSurahAyah(selectedSurah, ayah);
              }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-gray-100"
            >
              {Array.from({ length: ayahCountForSelectedSurah }, (_, i) => i + 1).map((ayah) => (
                <option key={ayah} value={ayah}>
                  A{ayah}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMobileSettingsOpen((v) => !v)}
              className="rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-200"
              aria-label="Einstellungen"
            >
              <Settings size={14} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1">
            {mode === 'arabic' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(604, prev + 1))}
                  className="px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium disabled:opacity-50"
                  disabled={currentPage >= 604 || loadingJump}
                >
                  <span className="inline-flex items-center gap-1">
                    Weiter <ArrowLeft size={12} />
                  </span>
                </button>
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={submitPageInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitPageInput();
                  }}
                  className="w-20 text-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-gray-100"
                  aria-label="Seite"
                />
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                  disabled={currentPage <= 1 || loadingJump}
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowRight size={12} /> Zurück
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                  disabled={currentPage <= 1 || loadingJump}
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowLeft size={12} /> Zurück
                  </span>
                </button>
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={submitPageInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitPageInput();
                  }}
                  className="w-20 text-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-gray-100"
                  aria-label="Seite"
                />
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(604, prev + 1))}
                  className="px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium disabled:opacity-50"
                  disabled={currentPage >= 604 || loadingJump}
                >
                  <span className="inline-flex items-center gap-1">
                    Weiter <ArrowRight size={12} />
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile settings drawer */}
      {mobileSettingsOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileSettingsOpen(false)}>
          <div
            className="absolute top-[72px] right-2 left-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-3 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Reader Einstellungen</h3>
            {settingsControls}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-6 items-start pt-[190px] md:pt-0">
        <aside className="hidden md:block bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit lg:sticky lg:top-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Reader Einstellungen</h3>
          <div className="hidden md:block">{settingsControls}</div>
        </aside>

        <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[24rem]">
          {(loadingPage || loadingJump) && (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              <Loader2 size={20} className="animate-spin inline-block mr-2" />
              Quran-Seite wird geladen...
            </div>
          )}
          {!loadingPage && !loadingJump && errorMessage && (
            <div className="py-10 text-center text-rose-600 dark:text-rose-400">{errorMessage}</div>
          )}
          {!loadingPage && !loadingJump && !errorMessage && pageData && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                <span>Seite {pageData.pageNumber}</span>
                <span>•</span>
                <span>Juz {pageData.juzNumber}</span>
                <span>•</span>
                <span>Übersetzung: {pageData.translationEditionUsed}</span>
              </div>
              <div className="space-y-4">
                {pageData.verses.map((verse) => (
                  <article
                    key={verse.key}
                    className={`border-b border-gray-100 dark:border-gray-700 pb-3 rounded-lg px-2 transition-colors cursor-pointer ${
                      selectedVerseKey === verse.key
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                    onClick={() => {
                      setSelectedVerseKey(verse.key);
                      setSelectedSurah(verse.surahNumber);
                      setSelectedAyah(verse.ayahNumber);
                    }}
                  >
                    {mode === 'arabic' ? (
                      <p
                        className="leading-loose text-center font-quran text-gray-900 dark:text-gray-100"
                        dir="rtl"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {toQuranicSukoon(verse.arabicText)}
                      </p>
                    ) : (
                      <p
                        className="leading-relaxed text-gray-800 dark:text-gray-200"
                        style={{ fontSize: `${Math.max(16, Math.round(fontSize * 0.5))}px` }}
                      >
                        {verse.translationText || 'Für diesen Vers ist aktuell keine Übersetzung verfügbar.'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {verse.surahNumber}:{verse.ayahNumber}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="hidden md:block bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Mic size={16} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Aufnahme</h3>
        </div>
        {loadingAssignment ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Assignment wird geladen...</p>
        ) : hasAssignmentContext && assignment ? (
          <ReadingAudioCell
            assignmentId={assignment.id}
            audioUrls={normalizeAudioUrls(assignment)}
            canEdit={canEditAudio}
            onSaved={appendAssignmentAudio}
            onDeleted={removeAssignmentAudio}
            showUploadControls
          />
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Keine aktive Assignment-Session. Öffne den Reader über deinen heutigen Part in Hatim, um aufzunehmen.</p>
            <Link to="/hatim" className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
              <BookOpen size={14} /> Zu Hatim
            </Link>
          </div>
        )}
      </div>

      {/* Mobile fixed audio drawer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-2 pb-2">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileAudioOpen((v) => !v)}
            className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-gray-800 dark:text-gray-100"
          >
            <span className="inline-flex items-center gap-2">
              <Mic size={15} className="text-emerald-600 dark:text-emerald-400" />
              Aufnahme
            </span>
            {mobileAudioOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          {mobileAudioOpen && (
            <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 max-h-[45vh] overflow-y-auto">
              {loadingAssignment ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">Assignment wird geladen...</p>
              ) : hasAssignmentContext && assignment ? (
                <ReadingAudioCell
                  assignmentId={assignment.id}
                  audioUrls={normalizeAudioUrls(assignment)}
                  canEdit={canEditAudio}
                  onSaved={appendAssignmentAudio}
                  onDeleted={removeAssignmentAudio}
                  showUploadControls
                />
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 pt-2">
                  <p>Keine aktive Assignment-Session. Öffne den Reader über deinen heutigen Part in Hatim, um aufzunehmen.</p>
                  <Link to="/hatim" className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                    <BookOpen size={14} /> Zu Hatim
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
