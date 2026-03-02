import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronUp, Loader2, Mic, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ReadingAudioCell } from '../components/ReadingAudioCell';
import {
  getAyahPosition,
  getDefaultTranslationEdition,
  getDefaultQuranTextEdition,
  getTranslationEditions,
  getJuzStartPage,
  getQuranPage,
  getSurahList,
  type QuranTextEdition,
  type QuranPageData,
  type QuranVerse,
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
const FONT_SIZE_STORAGE_KEY = 'quran-reader-font-size';
const VIEW_LAYOUT_STORAGE_KEY = 'quran-reader-view-layout';
const QURAN_TEXT_STORAGE_KEY = 'quran-reader-text-type';
const HIDE_PAUSE_MARKS_STORAGE_KEY = 'quran-reader-hide-pause-marks';
const DEFAULT_FONT_SIZE = 36;

type ViewLayout = 'verse' | 'flow';
const QURAN_TEXT_OPTIONS: QuranTextEdition[] = [
  'quran-uthmani',
  'quran-uthmani-min',
  'quran-simple',
  'quran-simple-plain',
  'quran-simple-min',
  'quran-simple-clean',
];

const PAUSE_MARKS = new Set([
  '\u06D6', '\u06D7', '\u06D8', '\u06D9', '\u06DA', '\u06DB', '\u06DC',
  '\u06DD', '\u06DE', '\u06E2', '\u06E3',
]);

function renderArabicWithPauseMarks(text: string, hidePauseMarks: boolean): ReactNode[] {
  const rendered: ReactNode[] = [];
  let idx = 0;
  for (const ch of text) {
    if (PAUSE_MARKS.has(ch)) {
      if (!hidePauseMarks) {
        rendered.push(
          <span key={`pause-${idx}`} className="text-rose-600 dark:text-rose-400">
            {ch}
          </span>
        );
      }
    } else {
      rendered.push(ch);
    }
    idx += 1;
  }
  return rendered;
}

/** Ost-arabische Ziffern (٠١٢٣٤٥٦٧٨٩) für Versnummern im Arabisch-Modus. */
function toArabicIndicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + parseInt(d, 10)));
}

/** Uthmani Bismillah – für reine Bismillah-Erkennung (nur Vers). */
const BISMILLAH_ARABIC =
  '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650';
const BISMILLAH_PREFIX = BISMILLAH_ARABIC.trim();

/** Dieselbe Zeichenkette für Anzeige der Bismillah (fest, nicht aus API). */
const BISMILLAH_DISPLAY = BISMILLAH_PREFIX;

function shouldShowSurahBismillah(surahNumber: number, ayahNumber: number): boolean {
  return surahNumber !== 1 && surahNumber !== 9 && Number(ayahNumber) === 1;
}

/** Ende der Bismillah-Phrase (الرَّحِيمِ), um Trennung auch bei abweichender API-Schreibung zu finden. */
const END_OF_BISMILLAH = '\u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650';

/** Normalisiert für zuverlässigen Vergleich mit API-Text (Kombinationszeichen-Reihenfolge kann abweichen). */
function normalizeForBismillah(s: string): string {
  return s.replace(/\u06E1/g, '\u0652').normalize('NFD');
}

/** Entfernt die Bismillah-Übersetzung vom Anfang des ersten Verses (z. B. DE/EN), falls vorhanden. */
function getFirstVerseTranslationOnly(translationText: string | null): string {
  if (!translationText || !translationText.trim()) return translationText || '';
  const t = translationText.trim();
  const prefixes = [
    'Im Namen Allahs, des Allerbarmers, des Barmherzigen.',
    'Im Namen Allahs, des Allerbarmers, des Barmherzigen',
    'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    'In the name of Allah, the Entirely Merciful, the Especially Merciful',
  ];
  for (const p of prefixes) {
    if (t === p) return '';
    if (t.startsWith(p)) return t.slice(p.length).replace(/^[\s.;]+/, '').trim();
  }
  return t;
}

/** Entfernt Bismillah aus Vers 1 (nur Suren != 1/9). */
function stripBismillahFromArabicFirstVerse(
  surahNumber: number,
  ayahNumber: number,
  arabicText: string
): string {
  if (!shouldShowSurahBismillah(surahNumber, ayahNumber)) return arabicText;
  const raw = arabicText.trim();
  const n = normalizeForBismillah(raw);
  const prefixNorm = normalizeForBismillah(BISMILLAH_PREFIX);
  const endNorm = normalizeForBismillah(END_OF_BISMILLAH);
  let rest = '';
  if (n.startsWith(prefixNorm)) {
    rest = n.slice(prefixNorm.length).replace(/^\s+/, '').trim().normalize('NFC');
  } else {
    const endIdx = n.indexOf(endNorm);
    if (endIdx >= 0 && endIdx < 80) {
      rest = n.slice(endIdx + endNorm.length).replace(/^\s+/, '').trim().normalize('NFC');
    } else {
      return raw;
    }
  }
  return rest.length > 0 ? rest : raw;
}

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
  const [quranTextType, setQuranTextType] = useState<QuranTextEdition>(() => {
    if (typeof window === 'undefined') return getDefaultQuranTextEdition();
    const saved = window.localStorage.getItem(QURAN_TEXT_STORAGE_KEY);
    if (saved && QURAN_TEXT_OPTIONS.includes(saved as QuranTextEdition)) return saved as QuranTextEdition;
    return getDefaultQuranTextEdition();
  });
  const [hidePauseMarks, setHidePauseMarks] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(HIDE_PAUSE_MARKS_STORAGE_KEY) === 'true';
  });
  const [translationEdition, setTranslationEdition] = useState(getDefaultTranslationEdition());
  const [translationOptions, setTranslationOptions] = useState<TranslationEdition[]>([]);
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_FONT_SIZE;
    const raw = Number(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY));
    if (!Number.isFinite(raw)) return DEFAULT_FONT_SIZE;
    return Math.max(18, Math.min(56, Math.round(raw)));
  });
  const [viewLayout, setViewLayout] = useState<ViewLayout>(() => {
    if (typeof window === 'undefined') return 'verse';
    const raw = window.localStorage.getItem(VIEW_LAYOUT_STORAGE_KEY);
    return raw === 'flow' ? 'flow' : 'verse';
  });
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
        Quran Text
        <select
          value={quranTextType}
          onChange={(e) => setQuranTextType(e.target.value as QuranTextEdition)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          <option value="quran-uthmani">Uthmani</option>
          <option value="quran-uthmani-min">Uthmani Minimal</option>
          <option value="quran-simple">Simple</option>
          <option value="quran-simple-plain">Simple Plain</option>
          <option value="quran-simple-min">Simple Minimal</option>
          <option value="quran-simple-clean">Simple Clean</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <input
          type="checkbox"
          checked={hidePauseMarks}
          onChange={(e) => setHidePauseMarks(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
        />
        Pausenmarkierungen ausblenden
      </label>
      <label className="text-sm text-gray-600 dark:text-gray-300 block">
        Ansicht
        <select
          value={viewLayout}
          onChange={(e) => setViewLayout(e.target.value as ViewLayout)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          <option value="verse">Einzelverse</option>
          <option value="flow">Fließtext</option>
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
        Standard ist Uthmani.
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
        const data = await getQuranPage(currentPage, translationEdition, quranTextType);
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
  }, [currentPage, translationEdition, quranTextType]);

  useEffect(() => {
    const visibleVerses = pageData?.verses.filter((v) => v.ayahNumber !== 0) ?? [];
    if (!visibleVerses.length) {
      setSelectedVerseKey(null);
      return;
    }
    let verseToSelect = visibleVerses[0];
    if (pendingVerseSelection === 'last') {
      verseToSelect = visibleVerses[visibleVerses.length - 1];
    } else if (pendingVerseSelection !== 'first') {
      const existing = selectedVerseKey ? visibleVerses.find((v) => v.key === selectedVerseKey) : null;
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
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_LAYOUT_STORAGE_KEY, viewLayout);
  }, [viewLayout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(QURAN_TEXT_STORAGE_KEY, quranTextType);
  }, [quranTextType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(HIDE_PAUSE_MARKS_STORAGE_KEY, hidePauseMarks ? 'true' : 'false');
  }, [hidePauseMarks]);

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
      if (isEditable || loadingPage || loadingJump || pendingVerseSelection || !pageData?.verses?.length) return;

      const verses = pageData.verses.filter((v) => v.ayahNumber !== 0);
      if (!verses.length) return;
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
    <div className="space-y-4 pb-44 md:pb-0">
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 px-2 pt-1">
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

          <div className="grid grid-cols-3 gap-1">
            <select
              value={selectedJuz}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSelectedJuz(next);
                void jumpToJuz(next);
              }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1.5 py-1 text-[11px] text-gray-900 dark:text-gray-100"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  Juz {j}
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
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1.5 py-1 text-[11px] text-gray-900 dark:text-gray-100"
            >
              {surahs.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.englishName}
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
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1.5 py-1 text-[11px] text-gray-900 dark:text-gray-100"
            >
              {Array.from({ length: ayahCountForSelectedSurah }, (_, i) => i + 1).map((ayah) => (
                <option key={ayah} value={ayah}>
                  Ayah {ayah}
                </option>
              ))}
            </select>
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
                <button
                  type="button"
                  onClick={() => setMobileSettingsOpen((v) => !v)}
                  className="rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-1.5 text-gray-700 dark:text-gray-200"
                  aria-label="Einstellungen"
                >
                  <Settings size={13} />
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
                <button
                  type="button"
                  onClick={() => setMobileSettingsOpen((v) => !v)}
                  className="rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-1.5 text-gray-700 dark:text-gray-200"
                  aria-label="Einstellungen"
                >
                  <Settings size={13} />
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
            className="absolute top-[140px] right-2 left-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-3 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Reader Einstellungen</h3>
            {settingsControls}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-6 items-start pt-[176px] md:pt-0">
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
              {viewLayout === 'flow' ? (() => {
                type Segment = { surahNumber: number; showHeader: boolean; showBismillah: boolean; verses: QuranVerse[] };
                const segments: Segment[] = [];
                let current: Segment | null = null;
                for (const v of pageData.verses) {
                  if (v.ayahNumber === 0) continue;
                  if (!current || current.surahNumber !== v.surahNumber) {
                    current = {
                      surahNumber: v.surahNumber,
                      showHeader: Number(v.ayahNumber) === 1,
                      showBismillah: shouldShowSurahBismillah(v.surahNumber, v.ayahNumber),
                      verses: [v],
                    };
                    segments.push(current);
                  } else {
                    current.verses.push(v);
                  }
                }
                return (
                  <div className="space-y-4">
                    {segments.map((seg, segIdx) => {
                      const surahMeta = surahs.find((s) => s.number === seg.surahNumber);
                      const surahName = surahMeta?.name ?? `سورة ${seg.surahNumber}`;
                      return (
                        <Fragment key={`seg-${segIdx}-${seg.surahNumber}`}>
                          {seg.showHeader && (
                            <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                              <div className="relative mx-auto max-w-md rounded-xl border-2 border-emerald-500/60 dark:border-emerald-400/50 bg-white dark:bg-gray-800/80 py-3 px-4 shadow-sm">
                                <div className="absolute inset-y-0 left-0 w-8 rounded-l-xl border-r border-emerald-500/40 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-900/20" aria-hidden />
                                <div className="absolute inset-y-0 right-0 w-8 rounded-r-xl border-l border-emerald-500/40 dark:border-emerald-400/30 bg-gradient-to-l from-emerald-50/80 to-transparent dark:from-emerald-900/20" aria-hidden />
                                <p className="relative text-center font-bold text-gray-900 dark:text-gray-100 font-quran" dir="rtl" style={{ fontSize: `${Math.max(26, Math.round(fontSize * 0.9))}px` }}>
                                  {surahName}
                                </p>
                              </div>
                            </div>
                          )}
                          {seg.showBismillah && (
                            <div className="border-b border-gray-100 dark:border-gray-700 pb-2 rounded-lg px-2">
                              {mode === 'arabic' ? (
                                <p className="leading-loose text-center font-quran font-bold text-gray-900 dark:text-gray-100" dir="rtl" style={{ fontSize: `${fontSize}px` }}>
                                  {renderArabicWithPauseMarks(toQuranicSukoon(BISMILLAH_DISPLAY), hidePauseMarks)}
                                </p>
                              ) : (
                                <p className="leading-relaxed text-center font-bold text-gray-800 dark:text-gray-200" style={{ fontSize: `${Math.max(16, Math.round(fontSize * 0.5))}px` }}>
                                  Im Namen Allahs, des Allerbarmers, des Barmherzigen.
                                </p>
                              )}
                            </div>
                          )}
                          <div
                            className={`leading-loose rounded-lg px-2 ${mode === 'arabic' ? 'text-center font-quran text-gray-900 dark:text-gray-100' : 'text-gray-800 dark:text-gray-200'}`}
                            dir={mode === 'arabic' ? 'rtl' : 'ltr'}
                            style={{ fontSize: mode === 'arabic' ? `${fontSize}px` : `${Math.max(16, Math.round(fontSize * 0.5))}px` }}
                          >
                            {seg.verses.map((verse) => {
                              const text = mode === 'arabic'
                                ? toQuranicSukoon(stripBismillahFromArabicFirstVerse(verse.surahNumber, verse.ayahNumber, verse.arabicText))
                                : (shouldShowSurahBismillah(verse.surahNumber, verse.ayahNumber)
                                  ? getFirstVerseTranslationOnly(verse.translationText)
                                  : (verse.translationText || ''));
                              const num = mode === 'arabic' ? toArabicIndicDigits(verse.ayahNumber) : `(${verse.ayahNumber})`;
                              const isSelected = selectedVerseKey === verse.key;
                              return (
                                <span
                                  key={verse.key}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => { setSelectedVerseKey(verse.key); setSelectedSurah(verse.surahNumber); setSelectedAyah(verse.ayahNumber); }}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedVerseKey(verse.key); setSelectedSurah(verse.surahNumber); setSelectedAyah(verse.ayahNumber); } }}
                                  className={`cursor-pointer ${isSelected ? 'bg-emerald-100/50 dark:bg-emerald-900/20 rounded' : 'hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 rounded'}`}
                                  aria-label={`Vers ${verse.ayahNumber}`}
                                >
                                  <span>{mode === 'arabic' ? renderArabicWithPauseMarks(text, hidePauseMarks) : text}</span>
                                  {' '}
                                  <span
                                    className={mode === 'arabic'
                                      ? `inline-flex align-middle justify-center min-w-[1.5em] w-7 h-7 rounded-full border-2 border-emerald-500/70 dark:border-emerald-400/60 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-sm font-medium mx-0.5 ${isSelected ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''}`
                                      : `text-emerald-600 dark:text-emerald-400 font-medium ${isSelected ? 'underline' : ''}`}
                                  >
                                    {num}
                                  </span>
                                  {' '}
                                </span>
                              );
                            })}
                          </div>
                        </Fragment>
                      );
                    })}
                  </div>
                );
              })() : (
              <div className="space-y-4">
                {pageData.verses.map((verse) => {
                  if (verse.ayahNumber === 0) return null;
                  const showFirstVerseSplit = shouldShowSurahBismillah(verse.surahNumber, verse.ayahNumber);
                  if (showFirstVerseSplit) {
                    const surahMeta = surahs.find((s) => s.number === verse.surahNumber);
                    const surahName = surahMeta?.name ?? `سورة ${verse.surahNumber}`;
                    const verse1Text =
                      mode === 'arabic'
                        ? stripBismillahFromArabicFirstVerse(verse.surahNumber, verse.ayahNumber, verse.arabicText)
                        : getFirstVerseTranslationOnly(verse.translationText);
                    return (
                      <Fragment key={verse.key}>
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                          <div className="relative mx-auto max-w-md rounded-xl border-2 border-emerald-500/60 dark:border-emerald-400/50 bg-white dark:bg-gray-800/80 py-3 px-4 shadow-sm">
                            <div className="absolute inset-y-0 left-0 w-8 rounded-l-xl border-r border-emerald-500/40 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-900/20" aria-hidden />
                            <div className="absolute inset-y-0 right-0 w-8 rounded-r-xl border-l border-emerald-500/40 dark:border-emerald-400/30 bg-gradient-to-l from-emerald-50/80 to-transparent dark:from-emerald-900/20" aria-hidden />
                            <p
                              className="relative text-center font-bold text-gray-900 dark:text-gray-100 font-quran"
                              dir="rtl"
                              style={{ fontSize: `${Math.max(26, Math.round(fontSize * 0.9))}px` }}
                            >
                              {surahName}
                            </p>
                          </div>
                        </div>
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-2 rounded-lg px-2">
                          {mode === 'arabic' ? (
                            <p
                              className="leading-loose text-center font-quran font-bold text-gray-900 dark:text-gray-100"
                              dir="rtl"
                              style={{ fontSize: `${fontSize}px` }}
                            >
                              {renderArabicWithPauseMarks(toQuranicSukoon(BISMILLAH_DISPLAY), hidePauseMarks)}
                            </p>
                          ) : (
                            <p
                              className="leading-relaxed text-center font-bold text-gray-800 dark:text-gray-200"
                              style={{ fontSize: `${Math.max(16, Math.round(fontSize * 0.5))}px` }}
                            >
                              Im Namen Allahs, des Allerbarmers, des Barmherzigen.
                            </p>
                          )}
                        </div>
                        <article
                          className={`border-b border-gray-100 dark:border-gray-700 pb-3 rounded-lg px-2 transition-colors cursor-pointer flex gap-2 ${
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
                          <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0 pt-1">
                            {verse.surahNumber}:{verse.ayahNumber}
                          </p>
                          {mode === 'arabic' ? (
                            <p
                              className="leading-loose text-center font-quran font-normal text-gray-900 dark:text-gray-100 flex-1 min-w-0"
                              dir="rtl"
                              style={{ fontSize: `${fontSize}px` }}
                            >
                              {renderArabicWithPauseMarks(toQuranicSukoon(verse1Text), hidePauseMarks)}
                            </p>
                          ) : (
                            <p
                              className="leading-relaxed text-gray-800 dark:text-gray-200 flex-1 min-w-0"
                              style={{ fontSize: `${Math.max(16, Math.round(fontSize * 0.5))}px` }}
                            >
                              {verse1Text || 'Für diesen Vers ist aktuell keine Übersetzung verfügbar.'}
                            </p>
                          )}
                        </article>
                      </Fragment>
                    );
                  }

                  return (
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
                          {renderArabicWithPauseMarks(
                            toQuranicSukoon(stripBismillahFromArabicFirstVerse(verse.surahNumber, verse.ayahNumber, verse.arabicText)),
                            hidePauseMarks
                          )}
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
                  );
                })}
              </div>
              )}
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
      <div className="md:hidden fixed bottom-[80px] left-0 right-0 z-20 px-2">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between text-sm font-medium text-gray-800 dark:text-gray-100">
              <span className="inline-flex items-center gap-2">
                <Mic size={15} className="text-emerald-600 dark:text-emerald-400" />
                Aufnahme
              </span>
              <button
                type="button"
                onClick={() => setMobileAudioOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs"
              >
                Audios
                {mobileAudioOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
            <div className="mt-1.5">
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
                  showPlayers={mobileAudioOpen}
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
          </div>
        </div>
      </div>
    </div>
  );
}
