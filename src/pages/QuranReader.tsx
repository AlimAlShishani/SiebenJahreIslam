import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, CheckCircle, Loader2, Mic, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRecording } from '../context/RecordingContext';
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
import { triggerPushForActivity } from '../lib/pushNotifications';
import { getKahfWindow, isKahfWindowActiveSync } from '../lib/maghrib';
import { getSlotGoalConfig } from '../lib/slots';
import { calculatePageProgress } from '../lib/readingGoal';

interface AssignmentForReader {
  id: string;
  group_id?: string;
  date?: string;
  juz_number?: number;
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
const FONT_SIZE_FLOW_STORAGE_KEY = 'quran-reader-font-size-flow';
const FONT_SIZE_VERSE_STORAGE_KEY = 'quran-reader-font-size-verse';
const DEFAULT_FONT_SIZE_FLOW = 25;
const DEFAULT_FONT_SIZE_VERSE = 30;
const VIEW_LAYOUT_STORAGE_KEY = 'quran-reader-view-layout';
const QURAN_TEXT_STORAGE_KEY = 'quran-reader-text-type';
const HIDE_PAUSE_MARKS_STORAGE_KEY = 'quran-reader-hide-pause-marks';
const ARABIC_FONT_STORAGE_KEY = 'quran-reader-arabic-font';
const LAST_LOCATION_STORAGE_KEY_PREFIX = 'quran-reader-last-location';
const SAVED_VERSES_STORAGE_KEY = 'quran-saved-verses';

type ViewLayout = 'verse' | 'flow';
type ArabicFontChoice = 'uthmanic' | 'scheherazade';
type SavedVerse = {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  arabic: string;
  translation: string;
  savedAt: string;
};
const QURAN_TEXT_OPTIONS: QuranTextEdition[] = [
  'quran-uthmani',
  'quran-uthmani-min',
  'quran-simple',
  'quran-simple-plain',
  'quran-simple-min',
  'quran-simple-clean',
];

/** Unicode-Bereiche für Quran-Pausenzeichen (Waqf). 06E2/06ED = bedingtes Meem (Iqlab), ausgenommen. */
function isQuranicPauseMark(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  if (cp >= 0x06D6 && cp <= 0x06DC) return true; // Kleine hohe Zeichen (Sad, Qaf, Meem, Lam Alef, Jeem, drei Punkte, Seen)
  if (cp === 0x06EA) return true; // Arabic Center Stop Mark
  if (cp === 0x06EC) return true; // Arabic Rounded High Stop with Filled Centre
  return false;
}
const SMALL_HIGH_MEEM = '\u06E2';
const SMALL_LOW_MEEM = '\u06ED';
const SMALL_LOW_MEEM_ALT = '\u06E3';
const SMALL_HIGH_MEEM_ALT = '\u06E1'; // Arabic Small High Meem (alternative)
const SMALL_HIGH_MEEM_ALT2 = '\u06EB'; // Arabic Small High Meem (alternative 2)
const ARABIC_TATWEEL = '\u0640'; // ـ (Kashida) – Platzhalter für Iqlab-Position

function isConditionalMeemMark(ch: string): boolean {
  return (
    ch === SMALL_HIGH_MEEM ||
    ch === SMALL_LOW_MEEM ||
    ch === SMALL_LOW_MEEM_ALT ||
    ch === SMALL_HIGH_MEEM_ALT ||
    ch === SMALL_HIGH_MEEM_ALT2
  );
}

/** Unicode-Bereich für Iqlab/kleine Annotationen (06E0–06EF, außer Pausenzeichen 06EA/06EC). */
function isIqlabChar(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return cp >= 0x06E0 && cp <= 0x06EF && cp !== 0x06EA && cp !== 0x06EC;
}

/** Splittet Buffer-Text und wrappt Iqlab-Zeichen in Spans (falls sie im Buffer landen). */
function flushBufferWithIqlabSpans(
  buffer: string,
  rendered: ReactNode[],
  keyPrefix: string
): void {
  if (!buffer) return;
  const iqlabChars = new Set([
    SMALL_HIGH_MEEM,
    SMALL_LOW_MEEM,
    SMALL_LOW_MEEM_ALT,
    SMALL_HIGH_MEEM_ALT,
    SMALL_HIGH_MEEM_ALT2,
  ]);
  // U+06E1 (QURANIC_SUKOON) nicht als Iqlab – wird als Sukoon im Buffer angezeigt
  const checkIqlab = (c: string) => (c !== QURANIC_SUKOON && iqlabChars.has(c)) || isIqlabChar(c);
  const parts: ReactNode[] = [];
  let current = '';
  let keyIdx = 0;
  for (const ch of buffer) {
    if (checkIqlab(ch)) {
      const beforeIqlab = current;
      if (current) {
        parts.push(current);
        current = '';
        keyIdx += 1;
      }
      const arr = Array.from(beforeIqlab);
      const lastChar = arr[arr.length - 1] ?? '';
      const secondLast = arr[arr.length - 2] ?? '';
      const afterKasrah = lastChar === '\u064D';
      const afterDamma = lastChar === '\u064C';
      const afterFatha = lastChar === '\u0627' || lastChar === '\u064B' || secondLast === '\u064B';
      // Abstand/ـ vor dem Meem: Meem rendert darüber statt über dem Tanween-Buchstaben
      if (afterKasrah || afterDamma) {
        parts.push('\u00A0'); // geschütztes Leerzeichen
      } else if (afterFatha) {
        parts.push(ARABIC_TATWEEL); // ـ zwischen Alif und Meem
      }
      parts.push(<span key={`${keyPrefix}-${keyIdx}`} className="iqlab-meem">{ch}</span>);
      keyIdx += 1;
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  for (const p of parts) {
    rendered.push(p);
  }
}

/** Nächster relevanter arabischer Buchstabe und sein Index. */
function nextRelevantArabicLetterAndIndex(text: string, fromIndex: number): { ch: string; index: number } | null {
  for (let i = fromIndex + 1; i < text.length; i++) {
    const ch = text[i];
    const cp = ch.codePointAt(0) ?? 0;
    if (ch.trim() === '') continue;
    if (isArabicCombiningMark(ch)) continue;
    if (isQuranicPauseMark(ch)) continue;
    if (isConditionalMeemMark(ch)) continue;
    if ((cp >= 0x0621 && cp <= 0x063A) || (cp >= 0x0641 && cp <= 0x064A)) return { ch, index: i };
  }
  return null;
}

/** Soll das Iqlab-Meem angezeigt werden? Bei Tanween Fatha steht Alif (ا) vor Ba (ب). */
function shouldShowIqlabMark(text: string, fromIndex: number): boolean {
  const first = nextRelevantArabicLetterAndIndex(text, fromIndex);
  if (!first) return false;
  if (first.ch === '\u0628') return true; // ب direkt
  if (first.ch === '\u0627') {
    // Tanween Fatha: Buchstabe + ـً + Alif + Ba – Alif ohne Tashkeel überspringen
    const second = nextRelevantArabicLetterAndIndex(text, first.index);
    return second?.ch === '\u0628';
  }
  return false;
}

const NBSP = '\u00A0';

function renderArabicWithPauseMarks(text: string, hidePauseMarks: boolean, preventOrphans = false): ReactNode[] {
  const normalized = typeof text === 'string' ? text.normalize('NFC') : text;
  const chars = Array.from(normalized);
  const rendered: ReactNode[] = [];
  let buffer = '';
  let flushKey = 0;
  const flushBuffer = () => {
    if (!buffer) return;
    flushBufferWithIqlabSpans(buffer, rendered, `buf-${flushKey++}`);
    buffer = '';
  };
  for (let idx = 0; idx < chars.length; idx++) {
    const ch = chars[idx];
    if (isConditionalMeemMark(ch)) {
      if (shouldShowIqlabMark(normalized, idx)) {
        const prevChar = idx > 0 ? chars[idx - 1] : '';
        const prevPrevChar = idx > 1 ? chars[idx - 2] : '';
        const afterTanweenKasrah = prevChar === '\u064D';
        const afterTanweenDamma = prevChar === '\u064C';
        const afterTanweenFatha =
          prevChar === '\u0627' || prevChar === '\u064B' || prevPrevChar === '\u064B';
        flushBuffer();
        if (afterTanweenKasrah || afterTanweenDamma) {
          rendered.push('\u00A0'); // geschütztes Leerzeichen vor Meem
        } else if (afterTanweenFatha) {
          rendered.push(ARABIC_TATWEEL); // ـ vor Meem
        }
        rendered.push(
          <span key={`iqlab-${idx}`} className="iqlab-meem">
            {ch}
          </span>
        );
      } else if (ch === QURANIC_SUKOON) {
        // U+06E1 = Quranic Sukoon (nicht Iqlab) – anzeigen statt überspringen
        buffer += ch;
      }
      continue;
    }
    if (isQuranicPauseMark(ch)) {
      if (!hidePauseMarks) {
        if (preventOrphans && buffer.length > 0) {
          const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
            ? new Intl.Segmenter('ar', { granularity: 'grapheme' })
            : null;
          const segments = segmenter ? [...segmenter.segment(buffer)] : null;
          const lastGrapheme = segments?.length
            ? segments[segments.length - 1].segment
            : buffer.slice(-1);
          const rest = segmenter && segments?.length
            ? buffer.slice(0, buffer.length - lastGrapheme.length)
            : buffer.slice(0, -1);
          if (rest) rendered.push(rest);
          rendered.push(
            <span key={`pause-${idx}`} className="quran-no-orphan">
              {lastGrapheme}
              <span className="quran-pause-mark">{'\u200C'}{ch}</span>
            </span>
          );
          buffer = '';
        } else {
          flushBuffer();
          rendered.push(
            <span key={`pause-${idx}`} className="quran-pause-mark">
              {'\u200C'}{ch}
            </span>
          );
        }
      }
    } else {
      buffer += ch;
    }
  }
  flushBuffer();
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
  const navigate = useNavigate();

  const assignmentId = searchParams.get('assignmentId');
  const assignmentDate = searchParams.get('date');
  const assignmentStartPage = Number(searchParams.get('startPage') || 1);
  const assignmentEndPage = Number(searchParams.get('endPage') || 604);
  const initialSurahParam = Number(searchParams.get('surah') || 0);
  const initialAyahParam = Number(searchParams.get('ayah') || 0);
  const slot = searchParams.get('slot') ?? (assignmentId ? 'hatim' : 'free');
  const lastLocationKey = `${LAST_LOCATION_STORAGE_KEY_PREFIX}-${slot}`;

  const isKahfSlot = slot === 'kahf';
  const KAHF_START_PAGE = 293;
  const KAHF_END_PAGE = 304; // Surah Kahf endet S.304, S.305 ist bereits Maryam
  const effectiveStartPage = isKahfSlot ? KAHF_START_PAGE : (assignmentId ? assignmentStartPage : 1);
  const effectiveEndPage = isKahfSlot ? KAHF_END_PAGE : (assignmentId ? assignmentEndPage : 604);

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
  const [arabicFont, setArabicFont] = useState<ArabicFontChoice>(() => {
    if (typeof window === 'undefined') return 'uthmanic';
    const saved = window.localStorage.getItem(ARABIC_FONT_STORAGE_KEY);
    return saved === 'scheherazade' ? 'scheherazade' : 'uthmanic';
  });
  const [translationEdition, setTranslationEdition] = useState(getDefaultTranslationEdition());
  const [translationOptions, setTranslationOptions] = useState<TranslationEdition[]>([]);
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(SAVED_VERSES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedVerse[] | unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (v: any): v is SavedVerse =>
          v &&
          typeof v.id === 'string' &&
          typeof v.surahNumber === 'number' &&
          typeof v.ayahNumber === 'number'
      );
    } catch {
      return [];
    }
  });
  const [copiedVerseId, setCopiedVerseId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_FONT_SIZE_FLOW;
    const layout = window.localStorage.getItem(VIEW_LAYOUT_STORAGE_KEY) === 'verse' ? 'verse' : 'flow';
    const key = layout === 'verse' ? FONT_SIZE_VERSE_STORAGE_KEY : FONT_SIZE_FLOW_STORAGE_KEY;
    const defaultVal = layout === 'verse' ? DEFAULT_FONT_SIZE_VERSE : DEFAULT_FONT_SIZE_FLOW;
    const raw = Number(window.localStorage.getItem(key));
    if (!Number.isFinite(raw)) return defaultVal;
    return Math.max(18, Math.min(56, Math.round(raw)));
  });
  const [viewLayout, setViewLayout] = useState<ViewLayout>(() => {
    if (typeof window === 'undefined') return 'flow';
    const raw = window.localStorage.getItem(VIEW_LAYOUT_STORAGE_KEY);
    return raw === 'verse' ? 'verse' : 'flow';
  });
  const [verseIndexInPage, setVerseIndexInPage] = useState(0);
  const [versePageTransition, setVersePageTransition] = useState<'idle' | 'changing'>('idle');
  const [pageInput, setPageInput] = useState(() => {
    const fallback = Math.max(effectiveStartPage, Math.min(effectiveEndPage, assignmentStartPage || effectiveStartPage));
    if (typeof window === 'undefined') return String(fallback);
    if (assignmentId) return String(fallback);
    // Wenn explizit surah/ayah in der URL stehen (z. B. aus dem Profil),
    // vertrauen wir auf startPage und ignorieren gespeicherte Position.
    if (initialSurahParam && initialAyahParam) return String(fallback);
    const raw = window.localStorage.getItem(lastLocationKey);
    if (!raw) return String(fallback);
    try {
      const parsed = JSON.parse(raw) as { page?: number };
      const p = Number(parsed.page);
      if (Number.isFinite(p)) {
        const clamped = Math.max(effectiveStartPage, Math.min(effectiveEndPage, Math.round(p)));
        return String(clamped);
      }
    } catch {
      // ignore
    }
    return String(fallback);
  });
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [mobileAudioOpen, setMobileAudioOpen] = useState(false);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [selectedSurah, setSelectedSurah] = useState(() => {
    if (typeof window === 'undefined' || assignmentId) return 1;
    const raw = window.localStorage.getItem(lastLocationKey);
    if (isKahfSlot) {
      if (!raw) return 18;
      try {
        JSON.parse(raw);
        return 18;
      } catch {
        return 18;
      }
    }
    if (!raw) return 1;
    try {
      const parsed = JSON.parse(raw) as { surah?: number };
      const s = Number(parsed.surah);
      if (Number.isFinite(s) && s >= 1 && s <= 114) return Math.floor(s);
    } catch {
      // ignore
    }
    return 1;
  });
  const [selectedAyah, setSelectedAyah] = useState(() => {
    if (typeof window === 'undefined' || assignmentId) return 1;
    const raw = window.localStorage.getItem(lastLocationKey);
    if (isKahfSlot) {
      if (!raw) return 1;
      try {
        const parsed = JSON.parse(raw) as { ayah?: number };
        const a = Number(parsed.ayah);
        if (Number.isFinite(a) && a >= 1) return Math.max(1, Math.min(110, Math.floor(a)));
      } catch {
        // ignore
      }
      return 1;
    }
    if (!raw) return 1;
    try {
      const parsed = JSON.parse(raw) as { ayah?: number };
      const a = Number(parsed.ayah);
      if (Number.isFinite(a) && a >= 1) return Math.floor(a);
    } catch {
      // ignore
    }
    return 1;
  });
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(() => {
    if (typeof window === 'undefined' || assignmentId) return null;
    const raw = window.localStorage.getItem(lastLocationKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { verseKey?: string };
      if (parsed.verseKey && typeof parsed.verseKey === 'string') {
        return parsed.verseKey;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [pendingVerseSelection, setPendingVerseSelection] = useState<'first' | 'last' | null>(null);
  const [pendingVerseKey, setPendingVerseKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const fallback = Math.max(effectiveStartPage, Math.min(effectiveEndPage, assignmentStartPage || effectiveStartPage));
    if (typeof window === 'undefined') return fallback;
    if (assignmentId) return fallback;
    // Wenn explizit surah/ayah in der URL stehen (z. B. aus dem Profil),
    // vertrauen wir auf startPage und ignorieren gespeicherte Position.
    if (initialSurahParam && initialAyahParam) return fallback;
    const raw = window.localStorage.getItem(lastLocationKey);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as { page?: number };
      const p = Number(parsed.page);
      if (Number.isFinite(p)) {
        return Math.max(effectiveStartPage, Math.min(effectiveEndPage, Math.round(p)));
      }
    } catch {
      // ignore
    }
    return fallback;
  });
  const [pageData, setPageData] = useState<QuranPageData | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingJump, setLoadingJump] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentForReader | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedJuzRange, setSelectedJuzRange] = useState<{ start: number; end: number }>({ start: 1, end: 604 });
  const [mobileRecording, setMobileRecording] = useState(false);
  const { setRecording: setRecordingContext } = useRecording();
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const selectedVerseRef = useRef<HTMLSpanElement | null>(null);
  const verseModeScrollRef = useRef<HTMLDivElement | null>(null);

  const hasAssignmentContext = !!assignmentId && !!assignment;
  const canEditAudio = !!user && !!assignment && (assignment.user_id === user.id || isAdmin);
  const isVerseAllowedInCurrentSlot = (v: QuranVerse) =>
    v.ayahNumber !== 0 &&
    (!isKahfSlot || (v.surahNumber === 18 && v.ayahNumber >= 1 && v.ayahNumber <= 110));

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
      <label className="text-sm text-gray-600 dark:text-gray-300 block">
        Quran Schriftart
        <select
          value={arabicFont}
          onChange={(e) => setArabicFont(e.target.value as ArabicFontChoice)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
        >
          <option value="uthmanic">Uthmanic Hafs</option>
          <option value="scheherazade">Scheherazade New</option>
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
        .select('id, group_id, date, juz_number, user_id, start_page, end_page, audio_url, audio_urls')
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
    if (isKahfSlot) {
      setSelectedJuzRange({ start: KAHF_START_PAGE, end: KAHF_END_PAGE });
      return;
    }
    let cancelled = false;
    const resolveJuzRange = async () => {
      try {
        const start = await getJuzStartPage(selectedJuz);
        const nextStart = selectedJuz < 30 ? await getJuzStartPage(selectedJuz + 1) : 605;
        if (cancelled) return;
        const end = Math.max(start, Math.min(604, nextStart - 1));
        setSelectedJuzRange({ start, end });
      } catch {
        if (!cancelled) setSelectedJuzRange({ start: 1, end: 604 });
      }
    };
    void resolveJuzRange();
    return () => {
      cancelled = true;
    };
  }, [selectedJuz, isKahfSlot]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const cfg = await getKahfWindow();
      if (cancelled) return;
      if (!isKahfWindowActiveSync(cfg)) {
        try {
          window.localStorage.removeItem(`${LAST_LOCATION_STORAGE_KEY_PREFIX}-kahf`);
        } catch {
          // ignore
        }
        if (isKahfSlot) {
          setCurrentPage(KAHF_START_PAGE);
          setPageInput(String(KAHF_START_PAGE));
          setSelectedSurah(18);
          setSelectedAyah(1);
          setSelectedVerseKey(null);
          setVerseIndexInPage(0);
        }
      }
    };
    void check();
    const t = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [isKahfSlot]);

  useEffect(() => {
    const visibleVerses = pageData?.verses.filter((v) => isVerseAllowedInCurrentSlot(v)) ?? [];
    if (!visibleVerses.length) {
      setSelectedVerseKey(null);
      return;
    }
    let verseToSelect = visibleVerses[0];

    // Sprung zur Sura: Zielvers erst setzen, wenn er auf der geladenen Seite ist
    if (pendingVerseKey) {
      const target = visibleVerses.find((v) => v.key === pendingVerseKey);
      if (target) {
        verseToSelect = target;
        setPendingVerseKey(null);
      } else {
        return; // Vers noch nicht auf dieser Seite – warten bis neue Seite geladen ist
      }
    } else if (
      !isKahfSlot &&
      initialSurahParam &&
      initialAyahParam &&
      !pendingVerseSelection &&
      !selectedVerseKey
    ) {
      const target = visibleVerses.find(
        (v) => v.surahNumber === initialSurahParam && v.ayahNumber === initialAyahParam
      );
      if (target) verseToSelect = target;
    } else if (isKahfSlot && !pendingVerseSelection && !selectedVerseKey) {
      const targetAyah = Math.max(1, Math.min(110, selectedAyah || 1));
      const target = visibleVerses.find((v) => v.surahNumber === 18 && v.ayahNumber === targetAyah);
      if (target) verseToSelect = target;
    } else if (pendingVerseSelection === 'last') {
      verseToSelect = visibleVerses[visibleVerses.length - 1];
    } else if (pendingVerseSelection !== 'first') {
      const existing = selectedVerseKey ? visibleVerses.find((v) => v.key === selectedVerseKey) : null;
      if (existing) verseToSelect = existing;
    }
    setSelectedVerseKey(verseToSelect.key);
    setSelectedSurah(verseToSelect.surahNumber);
    setSelectedAyah(verseToSelect.ayahNumber);
    if (pendingVerseSelection) setPendingVerseSelection(null);
  }, [pageData, pendingVerseSelection, selectedVerseKey, pendingVerseKey, initialSurahParam, initialAyahParam, isKahfSlot, selectedAyah]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = viewLayout === 'verse' ? FONT_SIZE_VERSE_STORAGE_KEY : FONT_SIZE_FLOW_STORAGE_KEY;
    window.localStorage.setItem(key, String(fontSize));
  }, [fontSize, viewLayout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_LAYOUT_STORAGE_KEY, viewLayout);
  }, [viewLayout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = viewLayout === 'verse' ? FONT_SIZE_VERSE_STORAGE_KEY : FONT_SIZE_FLOW_STORAGE_KEY;
    const defaultVal = viewLayout === 'verse' ? DEFAULT_FONT_SIZE_VERSE : DEFAULT_FONT_SIZE_FLOW;
    const raw = Number(window.localStorage.getItem(key));
    const next = Number.isFinite(raw) ? Math.max(18, Math.min(56, Math.round(raw))) : defaultVal;
    setFontSize((prev) => (prev !== next ? next : prev));
  }, [viewLayout]);

  useEffect(() => {
    setVerseIndexInPage(0);
  }, [pageData?.pageNumber]);

  useEffect(() => {
    if (viewLayout !== 'verse') return;
    setVersePageTransition('changing');
    const t = window.setTimeout(() => {
      setVersePageTransition('idle');
    }, 220);
    return () => window.clearTimeout(t);
  }, [viewLayout, pageData?.pageNumber]);

  useEffect(() => {
    if (viewLayout !== 'verse' || !pageData) return;
    const visible = pageData.verses.filter((v) => isVerseAllowedInCurrentSlot(v));
    if (!visible.length) return;
    const idx = selectedVerseKey ? visible.findIndex((v) => v.key === selectedVerseKey) : -1;
    if (idx >= 0) setVerseIndexInPage(idx);
  }, [viewLayout, pageData?.pageNumber, selectedVerseKey, isKahfSlot]);

  useEffect(() => {
    if (viewLayout !== 'flow' || !selectedVerseKey) return;
    const el = selectedVerseRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [viewLayout, selectedVerseKey]);

  useEffect(() => {
    if (viewLayout !== 'verse') return;
    const el = verseModeScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [viewLayout, selectedVerseKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(QURAN_TEXT_STORAGE_KEY, quranTextType);
  }, [quranTextType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(HIDE_PAUSE_MARKS_STORAGE_KEY, hidePauseMarks ? 'true' : 'false');
  }, [hidePauseMarks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ARABIC_FONT_STORAGE_KEY, arabicFont);
    document.documentElement.setAttribute('data-quran-font', arabicFont);
  }, [arabicFont]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      page: currentPage,
      surah: selectedSurah,
      ayah: selectedAyah,
      verseKey: selectedVerseKey,
      juz: selectedJuz,
    };
    try {
      window.localStorage.setItem(lastLocationKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [lastLocationKey, currentPage, selectedSurah, selectedAyah, selectedVerseKey, selectedJuz]);

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

      const verses = pageData.verses.filter((v) => isVerseAllowedInCurrentSlot(v));
      if (!verses.length) return;
      const selectedIndex = selectedVerseKey ? verses.findIndex((v) => v.key === selectedVerseKey) : -1;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (selectedIndex < 0) {
          const first = verses[0];
          setSelectedVerseKey(first.key);
          setSelectedSurah(first.surahNumber);
          setSelectedAyah(first.ayahNumber);
          setVerseIndexInPage(0);
          return;
        }
        if (selectedIndex < verses.length - 1) {
          const nextIdx = selectedIndex + 1;
          const next = verses[nextIdx];
          setSelectedVerseKey(next.key);
          setSelectedSurah(next.surahNumber);
          setSelectedAyah(next.ayahNumber);
          setVerseIndexInPage(nextIdx);
          return;
        }
        const active = selectedIndex >= 0 ? verses[selectedIndex] : null;
        if (isKahfSlot && active?.surahNumber === 18 && active?.ayahNumber === 110) return;
        if (currentPage < effectiveEndPage) {
          setPendingVerseSelection('first');
          setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1));
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
          setVerseIndexInPage(verses.length - 1);
          return;
        }
        if (selectedIndex > 0) {
          const prevIdx = selectedIndex - 1;
          const prevVerse = verses[prevIdx];
          setSelectedVerseKey(prevVerse.key);
          setSelectedSurah(prevVerse.surahNumber);
          setSelectedAyah(prevVerse.ayahNumber);
          setVerseIndexInPage(prevIdx);
          return;
        }
        if (currentPage > effectiveStartPage) {
          setPendingVerseSelection('last');
          setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1));
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (viewLayout === 'verse') {
          // Im Einzelvers-Modus: nächster Vers / nächste Seite
          if (selectedIndex < 0) {
            const first = verses[0];
            setSelectedVerseKey(first.key);
            setSelectedSurah(first.surahNumber);
            setSelectedAyah(first.ayahNumber);
            setVerseIndexInPage(0);
            return;
          }
          if (selectedIndex < verses.length - 1) {
            const nextIdx = selectedIndex + 1;
            const next = verses[nextIdx];
            setSelectedVerseKey(next.key);
            setSelectedSurah(next.surahNumber);
            setSelectedAyah(next.ayahNumber);
            setVerseIndexInPage(nextIdx);
            return;
          }
          const active = selectedIndex >= 0 ? verses[selectedIndex] : null;
          if (isKahfSlot && active?.surahNumber === 18 && active?.ayahNumber === 110) return;
          if (currentPage < effectiveEndPage) {
            setPendingVerseSelection('first');
            setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1));
          }
        } else {
          // Fließtext: Seitenwechsel wie bisher (arabisch rückwärts, Übersetzung vorwärts)
          if (mode === 'arabic') {
            setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1));
          } else {
            setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1));
          }
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (viewLayout === 'verse') {
          // Im Einzelvers-Modus: vorheriger Vers / vorige Seite (letzter Vers)
          if (selectedIndex < 0) {
            const last = verses[verses.length - 1];
            setSelectedVerseKey(last.key);
            setSelectedSurah(last.surahNumber);
            setSelectedAyah(last.ayahNumber);
            setVerseIndexInPage(verses.length - 1);
            return;
          }
          if (selectedIndex > 0) {
            const prevIdx = selectedIndex - 1;
            const prevVerse = verses[prevIdx];
            setSelectedVerseKey(prevVerse.key);
            setSelectedSurah(prevVerse.surahNumber);
            setSelectedAyah(prevVerse.ayahNumber);
            setVerseIndexInPage(prevIdx);
            return;
          }
          if (currentPage > effectiveStartPage) {
            setPendingVerseSelection('last');
            setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1));
          }
        } else {
          // Fließtext: Seitenwechsel wie bisher (arabisch vorwärts, Übersetzung rückwärts)
          if (mode === 'arabic') {
            setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1));
          } else {
            setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1));
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPage, effectiveEndPage, effectiveStartPage, loadingJump, loadingPage, mode, pageData, selectedVerseKey, viewLayout, isKahfSlot]);

  const jumpToJuz = async (juzNumber: number) => {
    setLoadingJump(true);
    try {
      const page = await getJuzStartPage(juzNumber);
      const clamped = Math.max(effectiveStartPage, Math.min(effectiveEndPage, page));
      setCurrentPage(clamped);
    } finally {
      setLoadingJump(false);
    }
  };

  const jumpToSurahAyah = async (surahNumber: number, ayahNumber: number) => {
    if (isKahfSlot && (surahNumber !== 18 || ayahNumber > 110)) return;
    setLoadingJump(true);
    try {
      const position = await getAyahPosition(surahNumber, ayahNumber);
      const clamped = Math.max(effectiveStartPage, Math.min(effectiveEndPage, position.pageNumber));
      setCurrentPage(clamped);
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
    const next = Math.max(effectiveStartPage, Math.min(effectiveEndPage, Math.round(parsed)));
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
        is_completed: true,
      })
      .eq('id', assignment.id);
    if (!error) {
      setAssignment((old) => (old ? { ...old, audio_urls: next, audio_url: next[0] ?? null, is_completed: true } : old));
      if (user?.id) {
        const logDate = assignment.date || assignmentDate || null;
        const logJuz = assignment.juz_number ?? selectedJuz;
        if (logDate && assignment.group_id) {
          const logPayload = {
            group_id: assignment.group_id,
            date: logDate,
            juz_number: logJuz,
            activity_type: 'audio_added',
            actor_user_id: user.id,
            assignment_user_id: assignment.user_id,
          } as const;
          const { error: logError } = await supabase.from('reading_activity_logs').insert(logPayload);
          if (logError) console.error('Error writing activity log:', logError);
          else {
            void triggerPushForActivity({
              group_id: assignment.group_id,
              date: logPayload.date,
              juz_number: logPayload.juz_number,
              activity_type: logPayload.activity_type,
              actor_user_id: logPayload.actor_user_id,
            });
          }
        }
      }
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
      const logDate = assignment.date || assignmentDate || null;
      const logJuz = assignment.juz_number ?? selectedJuz;
      if (logDate && assignment.group_id) {
        const { data: latestLog } = await supabase
          .from('reading_activity_logs')
          .select('id')
          .eq('group_id', assignment.group_id)
          .eq('date', logDate)
          .eq('juz_number', logJuz)
          .eq('assignment_user_id', assignment.user_id)
          .eq('activity_type', 'audio_added')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestLog?.id) {
          const { error: logDeleteError } = await supabase
            .from('reading_activity_logs')
            .delete()
            .eq('id', latestLog.id);
          if (logDeleteError) console.error('Error deleting activity log:', logDeleteError);
        }
      }
      setAssignment((old) => (old ? { ...old, audio_urls: next, audio_url: next[0] ?? null } : old));
    }
  };

  const visibleVerses = useMemo(
    () => pageData?.verses.filter((v) => isVerseAllowedInCurrentSlot(v)) ?? [],
    [pageData, isKahfSlot]
  );
  const totalVersesInPage = visibleVerses.length;
  const selectedVerseIndex = selectedVerseKey
    ? visibleVerses.findIndex((v) => v.key === selectedVerseKey)
    : -1;
  const activeVerseIndex = Math.min(
    Math.max(0, selectedVerseIndex >= 0 ? selectedVerseIndex : verseIndexInPage),
    Math.max(0, totalVersesInPage - 1)
  );
  const pageLabelArabic = toArabicIndicDigits(currentPage);

  const juzProgressPct = useMemo(() => {
    // Fortschritt immer relativ zum gesamten Juz, nicht nur zum eigenen Assignment
    const startPage = selectedJuzRange.start;
    const endPage = selectedJuzRange.end;
    if (!Number.isFinite(currentPage) || !Number.isFinite(startPage) || !Number.isFinite(endPage) || startPage > endPage) {
      return 0;
    }

    // Seitenbereich auf gültigen Juz-/Assignment-Bereich clampen
    const clampedPage = Math.min(Math.max(currentPage, startPage), endPage);
    const totalPages = endPage - startPage + 1;
    const pageIndex = clampedPage - startPage; // 0-basiert

    // Vers-Fortschritt innerhalb der aktuellen Seite (0–1)
    const verseFraction =
      totalVersesInPage > 0 ? (activeVerseIndex + 1) / totalVersesInPage : 0;

    // Gesamtfortschritt = (aktuelle Seite + Versanteil) relativ zu Gesamtseiten
    const overall = (pageIndex + verseFraction) / totalPages;
    return Math.max(0, Math.min(100, overall * 100));
  }, [
    assignmentEndPage,
    assignmentStartPage,
    currentPage,
    hasAssignmentContext,
    selectedJuzRange.end,
    selectedJuzRange.start,
    activeVerseIndex,
    totalVersesInPage,
  ]);

  const goalConfig = useMemo(() => {
    if (assignment && hasAssignmentContext) {
      return {
        goalStartPage: assignment.start_page,
        goalEndPage: assignment.end_page,
        goalLabel: `Seite ${assignment.start_page}–${assignment.end_page}`,
      };
    }
    if (isKahfSlot) {
      return { goalStartPage: KAHF_START_PAGE, goalEndPage: KAHF_END_PAGE, goalLabel: `Seite ${KAHF_START_PAGE}–${KAHF_END_PAGE}` };
    }
    return getSlotGoalConfig(slot);
  }, [assignment, hasAssignmentContext, isKahfSlot, slot]);

  const goalProgressPct = useMemo(() => {
    if (!goalConfig) return 0;
    const verseFraction = totalVersesInPage > 0 ? (activeVerseIndex + 1) / totalVersesInPage : 0;
    return calculatePageProgress(
      currentPage,
      goalConfig.goalStartPage,
      goalConfig.goalEndPage,
      verseFraction
    );
  }, [goalConfig, currentPage, activeVerseIndex, totalVersesInPage]);

  const goToPreviousVerse = () => {
    if (!visibleVerses.length) return;
    if (activeVerseIndex <= 0) {
      if (currentPage > effectiveStartPage) {
        setPendingVerseSelection('last');
        setCurrentPage((p) => Math.max(effectiveStartPage, p - 1));
      }
      return;
    }
    const prevIdx = activeVerseIndex - 1;
    const verse = visibleVerses[prevIdx];
    setVerseIndexInPage(prevIdx);
    if (verse) {
      setSelectedVerseKey(verse.key);
      setSelectedSurah(verse.surahNumber);
      setSelectedAyah(verse.ayahNumber);
    }
  };

  const goToNextVerse = () => {
    if (!visibleVerses.length) return;
    const active = visibleVerses[activeVerseIndex];
    if (isKahfSlot && active?.surahNumber === 18 && active?.ayahNumber === 110) return;
    if (activeVerseIndex >= visibleVerses.length - 1) {
      if (currentPage < effectiveEndPage) {
        setPendingVerseSelection('first');
        setCurrentPage((p) => Math.min(effectiveEndPage, p + 1));
      }
      return;
    }
    const nextIdx = activeVerseIndex + 1;
    const verse = visibleVerses[nextIdx];
    setVerseIndexInPage(nextIdx);
    if (verse) {
      setSelectedVerseKey(verse.key);
      setSelectedSurah(verse.surahNumber);
      setSelectedAyah(verse.ayahNumber);
    }
  };

  const goToPrevPageByMode = () => {
    if (mode === 'arabic') setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1));
    else setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1));
  };

  const goToNextPageByMode = () => {
    if (mode === 'arabic') setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1));
    else setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(max-width: 767px)').matches) return;
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(max-width: 767px)').matches) return;
    if (viewLayout === 'verse') return;
    if (loadingPage || loadingJump) return;
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX == null || startY == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // Nur horizontale Swipes mit genügend Abstand
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    // Links-Swipe: in Arabisch = Seite zurück, in Deutsch = Seite nach vorn
    // Rechts-Swipe: umgekehrt – das kapselt goToPrevPageByMode/goToNextPageByMode bereits korrekt.
    if (dx < 0) {
      goToPrevPageByMode();
    } else {
      goToNextPageByMode();
    }
  };

  return (
    <div className="relative md:space-y-4 max-md:h-[100dvh] max-md:overflow-hidden max-md:bg-gray-50 dark:max-md:bg-gray-900">
      <div className="hidden md:block bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <div className={`grid grid-cols-1 gap-3 ${isKahfSlot ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {!isKahfSlot && (
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
          )}
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Surah
            <select
              value={isKahfSlot ? 18 : selectedSurah}
              onChange={(e) => {
                const surah = Number(e.target.value);
                setSelectedSurah(surah);
                setSelectedAyah(1);
                setPendingVerseKey(`${surah}:1`);
                void jumpToSurahAyah(surah, 1);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            >
              {(isKahfSlot ? surahs.filter((s) => s.number === 18) : surahs).map((s) => (
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
                setPendingVerseKey(`${selectedSurah}:${ayah}`);
                void jumpToSurahAyah(selectedSurah, ayah);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            >
              {Array.from({ length: isKahfSlot ? 110 : ayahCountForSelectedSurah }, (_, i) => i + 1).map((ayah) => (
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
                onClick={() => setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage >= effectiveEndPage || loadingJump}
              >
                <span className="inline-flex items-center gap-1">
                  Weiter <ArrowLeft size={14} />
                </span>
              </button>
              <input
                type="number"
                min={effectiveStartPage}
                max={effectiveEndPage}
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
                onClick={() => setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1))}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage <= effectiveStartPage || loadingJump}
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
                onClick={() => setCurrentPage((prev) => Math.max(effectiveStartPage, prev - 1))}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage <= effectiveStartPage || loadingJump}
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Zurück
                </span>
              </button>
              <input
                type="number"
                min={effectiveStartPage}
                max={effectiveEndPage}
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
                onClick={() => setCurrentPage((prev) => Math.min(effectiveEndPage, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={currentPage >= effectiveEndPage || loadingJump}
              >
                <span className="inline-flex items-center gap-1">
                  Weiter <ArrowRight size={14} />
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 pt-2 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(assignmentId ? '/hatim' : '/quran')}
              className="h-8 w-8 shrink-0 rounded-md inline-flex items-center justify-center text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
              aria-label="Zurück"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1">
                <select
                  value={selectedJuz}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setSelectedJuz(next);
                    void jumpToJuz(next);
                  }}
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-gray-100 text-center"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                    <option key={j} value={j}>
                      Juz {j}
                    </option>
                  ))}
                </select>
                <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                    style={{ width: `${juzProgressPct}%` }}
                  />
                </div>
              </div>
              {goalConfig ? (
                <div className="flex-1 min-w-[5.5rem] rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-2 py-1">
                  <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 tabular-nums truncate text-center" title={goalConfig.goalLabel}>
                    {goalConfig.goalLabel}
                  </p>
                  <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                      style={{ width: `${goalProgressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setMobileSettingsOpen((v) => !v)}
              className="h-8 w-8 shrink-0 rounded-md inline-flex items-center justify-center text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
              aria-label="Einstellungen"
            >
              <Settings size={15} />
            </button>
          </div>

          <div className="mt-2">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden">
              <select
                value={isKahfSlot ? 18 : selectedSurah}
                onChange={(e) => {
                  const surah = Number(e.target.value);
                  setSelectedSurah(surah);
                  setSelectedAyah(1);
                  setPendingVerseKey(`${surah}:1`);
                  void jumpToSurahAyah(surah, 1);
                }}
                className="h-8 bg-transparent px-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600"
              >
                {(isKahfSlot ? surahs.filter((s) => s.number === 18) : surahs).map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.englishName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={effectiveStartPage}
                max={effectiveEndPage}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={submitPageInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitPageInput();
                }}
                className="h-8 min-w-[5.5rem] w-[5.5rem] px-2 text-center text-xs font-medium bg-transparent text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600"
                aria-label={`Seite ${currentPage} / ${pageLabelArabic}`}
              />
              <select
                value={selectedAyah}
                onChange={(e) => {
                  const ayah = Number(e.target.value);
                  setSelectedAyah(ayah);
                  const surah = isKahfSlot ? 18 : selectedSurah;
                  setPendingVerseKey(`${surah}:${ayah}`);
                  void jumpToSurahAyah(surah, ayah);
                }}
                className="h-8 bg-transparent px-2 text-xs text-gray-900 dark:text-gray-100 text-right"
              >
                {Array.from({ length: isKahfSlot ? 110 : ayahCountForSelectedSurah }, (_, i) => i + 1).map((ayah) => (
                  <option key={ayah} value={ayah}>
                    Vers {ayah}
                  </option>
                ))}
              </select>
            </div>
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

      <div
        className={`grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-6 items-start pt-0 ${
          viewLayout === 'verse'
            ? 'max-md:absolute max-md:inset-x-0 max-md:top-[112px] max-md:bottom-[72px] max-md:px-2 max-md:overflow-y-auto max-md:items-stretch max-md:gap-1'
            : 'max-md:absolute max-md:inset-x-0 max-md:top-[112px] max-md:bottom-[72px] max-md:px-2 max-md:overflow-y-auto max-md:gap-0'
        }`}
      >
        <aside className="hidden md:block space-y-4 h-fit lg:sticky lg:top-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Reader Einstellungen</h3>
            <div className="hidden md:block">{settingsControls}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 mb-2">
              <Mic size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">Aufnahme</h3>
            </div>
            {loadingAssignment ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Laden...</p>
            ) : hasAssignmentContext && assignment ? (
              <ReadingAudioCell
                assignmentId={assignment.id}
                assignmentUserId={assignment.user_id}
                audioUrls={normalizeAudioUrls(assignment)}
                canEdit={canEditAudio}
                onSaved={appendAssignmentAudio}
                onDeleted={removeAssignmentAudio}
                showUploadControls
                compact
                onRecordingChange={(active) => setRecordingContext(active)}
              />
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Öffne den Reader über deinen Part in Hatim.</p>
                <Link to="/hatim" className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                  <BookOpen size={12} /> Zu Hatim
                </Link>
              </div>
            )}
          </div>
        </aside>

        <section
          className={`relative bg-white dark:bg-gray-800 p-4 sm:p-6 md:pr-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[24rem] ${
            viewLayout === 'verse'
              ? 'max-md:flex-1 max-md:min-h-0 max-md:overflow-hidden max-md:flex max-md:flex-col max-md:p-3'
              : 'max-md:flex-1 max-md:min-h-0 max-md:overflow-hidden max-md:flex max-md:flex-col max-md:p-3'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Desktop: Lesezeichen nur im Fließtext; in Einzelvers-Ansicht ausgeblendet */}
          {viewLayout === 'flow' && (
          <div className="hidden md:flex absolute top-6 right-0 translate-x-full flex-col gap-3 z-10">
            <button
              type="button"
              onClick={() => setMode('arabic')}
              title="Arabisch"
              className={`min-h-[8.5rem] min-w-[4rem] py-3 px-3.5 rounded-r-lg border-2 border-l-0 border-gray-200 dark:border-gray-600 shadow-sm text-sm font-bold transition-colors flex flex-col items-center justify-center gap-0.5 ${
                mode === 'arabic'
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                  : 'bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="font-quran" dir="rtl">أ</span>
              <span className="font-quran" dir="rtl">ب</span>
              <span className="font-quran" dir="rtl">ت</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('translation')}
              title="Übersetzung"
              className={`min-h-[8.5rem] min-w-[4rem] py-3 px-3.5 rounded-r-lg border-2 border-l-0 border-gray-200 dark:border-gray-600 shadow-sm text-sm font-bold transition-colors flex flex-col items-center justify-center gap-0.5 ${
                mode === 'translation'
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                  : 'bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-400'
              }`}
            >
              <span>A</span>
              <span>B</span>
              <span>C</span>
            </button>
          </div>
          )}
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
            <div className={`space-y-4 max-md:flex max-md:flex-col max-md:flex-1 max-md:min-h-0 max-md:overflow-hidden ${viewLayout === 'verse' ? 'max-md:space-y-2' : ''}`}>
              {viewLayout === 'flow' ? (() => {
                type Segment = { surahNumber: number; showHeader: boolean; showBismillah: boolean; verses: QuranVerse[] };
                const segments: Segment[] = [];
                let current: Segment | null = null;
                for (const v of pageData.verses) {
                  if (!isVerseAllowedInCurrentSlot(v)) continue;
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
                  <div className="space-y-4 max-md:flex-1 max-md:min-h-0 max-md:overflow-y-auto max-md:pr-1">
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
                                  ref={isSelected ? selectedVerseRef : undefined}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => { setSelectedVerseKey(verse.key); setSelectedSurah(verse.surahNumber); setSelectedAyah(verse.ayahNumber); }}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedVerseKey(verse.key); setSelectedSurah(verse.surahNumber); setSelectedAyah(verse.ayahNumber); } }}
                                  className={`cursor-pointer ${isSelected ? 'bg-emerald-200/80 dark:bg-emerald-700/40 ring-1 ring-emerald-500/50 rounded' : 'hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 rounded'}`}
                                  aria-label={`Vers ${verse.ayahNumber}`}
                                >
                                  <span>{mode === 'arabic' ? renderArabicWithPauseMarks(text, hidePauseMarks, true) : text}</span>
                                  {NBSP}
                                  <span
                                    className={mode === 'arabic'
                                      ? `font-verse-num inline align-middle text-emerald-700 dark:text-emerald-300 font-semibold mx-1.5 ${isSelected ? 'underline underline-offset-2' : ''}`
                                      : `text-emerald-600 dark:text-emerald-400 font-medium ${isSelected ? 'underline' : ''}`}
                                    style={mode === 'arabic' ? { fontSize: `${fontSize}px` } : undefined}
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
              })() : (() => {
                const visibleVerses = pageData.verses.filter((v) => isVerseAllowedInCurrentSlot(v));
                const totalVerses = visibleVerses.length;
                const selectedIdx = selectedVerseKey
                  ? visibleVerses.findIndex((v) => v.key === selectedVerseKey)
                  : -1;
                const baseIndex = selectedIdx >= 0 ? selectedIdx : verseIndexInPage;
                const safeIndex = Math.min(Math.max(0, baseIndex), Math.max(0, totalVerses - 1));
                const currentVerse = visibleVerses[safeIndex] ?? visibleVerses[0];
                const progressPct =
                  totalVerses <= 1 ? 100 : (safeIndex / Math.max(1, totalVerses - 1)) * 100;

                const atFirstVerse = safeIndex <= 0;
                const atLastVerse = safeIndex >= totalVerses - 1;

                const goPrev = () => {
                  if (atFirstVerse && currentPage > effectiveStartPage) {
                    setPendingVerseSelection('last');
                    setCurrentPage((p) => Math.max(effectiveStartPage, p - 1));
                    return;
                  }
                  const prevIdx = Math.max(0, safeIndex - 1);
                  setVerseIndexInPage(prevIdx);
                  const v = visibleVerses[prevIdx];
                  if (v) {
                    setSelectedVerseKey(v.key);
                    setSelectedSurah(v.surahNumber);
                    setSelectedAyah(v.ayahNumber);
                  }
                };
                const goNext = () => {
                  if (isKahfSlot && currentVerse?.surahNumber === 18 && currentVerse?.ayahNumber === 110) return;
                  if (atLastVerse && currentPage < effectiveEndPage) {
                    setPendingVerseSelection('first');
                    setCurrentPage((p) => Math.min(effectiveEndPage, p + 1));
                    return;
                  }
                  const nextIdx = Math.min(totalVerses - 1, safeIndex + 1);
                  setVerseIndexInPage(nextIdx);
                  const v = visibleVerses[nextIdx];
                  if (v) {
                    setSelectedVerseKey(v.key);
                    setSelectedSurah(v.surahNumber);
                    setSelectedAyah(v.ayahNumber);
                  }
                };

                if (!currentVerse) {
                  return <div className="py-8 text-center text-gray-500 dark:text-gray-400">Keine Verse auf dieser Seite.</div>;
                }

                const arabicText = toQuranicSukoon(
                  stripBismillahFromArabicFirstVerse(currentVerse.surahNumber, currentVerse.ayahNumber, currentVerse.arabicText)
                );
                const translationText = shouldShowSurahBismillah(currentVerse.surahNumber, currentVerse.ayahNumber)
                  ? getFirstVerseTranslationOnly(currentVerse.translationText)
                  : (currentVerse.translationText || '');
                const isKahfCompleted =
                  isKahfSlot && currentVerse.surahNumber === 18 && currentVerse.ayahNumber === 110;

                const currentVerseId = `${currentVerse.surahNumber}:${currentVerse.ayahNumber}`;
                const isBookmarked = savedVerses.some((v) => v.id === currentVerseId);

                return (
                  <div
                    className={`relative flex flex-1 min-h-0 md:h-[22rem] transition-all duration-300 ease-out ${
                      versePageTransition === 'changing'
                        ? 'opacity-0 translate-x-3'
                        : 'opacity-100 translate-x-0'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4 flex flex-col min-h-0">
                      <div ref={verseModeScrollRef} className="flex-1 min-h-0 overflow-y-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:w-0">
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <p
                              className="leading-loose font-quran text-gray-900 dark:text-gray-100"
                              dir="rtl"
                              style={{ fontSize: `${fontSize}px` }}
                            >
                              {renderArabicWithPauseMarks(arabicText, hidePauseMarks, true)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {currentVerse.surahNumber}:{currentVerse.ayahNumber}
                            </p>
                            {isKahfCompleted && (
                              <div className="mt-3 flex flex-col items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-medium">
                                  <CheckCircle size={16} />
                                  Geschafft
                                </div>
                                <button
                                  type="button"
                                  onClick={() => navigate('/quran')}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm"
                                >
                                  Zurück zu Quran Instanzen
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-center border-t border-gray-200 dark:border-gray-600 pt-4 mt-2">
                            <p
                              className="leading-relaxed text-gray-800 dark:text-gray-200 text-center"
                              style={{ fontSize: `${Math.max(14, fontSize - 5)}px` }}
                            >
                              {translationText || 'Für diesen Vers ist aktuell keine Übersetzung verfügbar.'}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const base: SavedVerse = {
                                  id: currentVerseId,
                                  surahNumber: currentVerse.surahNumber,
                                  ayahNumber: currentVerse.ayahNumber,
                                  pageNumber: currentPage,
                                  arabic: arabicText,
                                  translation: translationText,
                                  savedAt: new Date().toISOString(),
                                };
                                setSavedVerses((prev) => {
                                  const exists = prev.some((v) => v.id === currentVerseId);
                                  const next = exists ? prev.filter((v) => v.id !== currentVerseId) : [...prev, base];
                                  if (typeof window !== 'undefined') {
                                    try {
                                      window.localStorage.setItem(SAVED_VERSES_STORAGE_KEY, JSON.stringify(next));
                                    } catch {
                                      // ignore
                                    }
                                  }
                                  return next;
                                });
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                                isBookmarked
                                  ? 'bg-emerald-600 border-emerald-700 text-white'
                                  : 'bg-white/80 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <span className="text-base leading-none">{isBookmarked ? '★' : '☆'}</span>
                              <span>{isBookmarked ? 'Gespeichert' : 'Speichern'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const textToCopy = `${arabicText}\n\n${translationText}`;
                                try {
                                  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                                    await navigator.clipboard.writeText(textToCopy);
                                  } else if (typeof window !== 'undefined') {
                                    // Fallback: nur bestmöglicher Versuch
                                    window.prompt('Text zum Kopieren:', textToCopy);
                                  }
                                  setCopiedVerseId(currentVerseId);
                                  if (typeof window !== 'undefined') {
                                    window.setTimeout(() => {
                                      setCopiedVerseId((prev) => (prev === currentVerseId ? null : prev));
                                    }, 3000);
                                  }
                                } catch {
                                  // ignore
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                                copiedVerseId === currentVerseId
                                  ? 'bg-emerald-600 border-emerald-700 text-white'
                                  : 'bg-white/80 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <span className="text-sm leading-none">📋</span>
                              <span>{copiedVerseId === currentVerseId ? 'Kopiert' : 'Kopieren'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:flex shrink-0 flex-wrap items-center justify-center gap-2 pt-4 pb-1 border-t border-gray-200 dark:border-gray-600 md:gap-4">
                        <button
                          type="button"
                          onClick={goPrev}
                          disabled={atFirstVerse && currentPage <= effectiveStartPage}
                          title={atFirstVerse && currentPage > effectiveStartPage ? 'Vorherige Seite' : 'Vorheriger Vers'}
                          className={`px-2 py-1.5 text-xs rounded-lg font-medium min-w-0 md:px-4 md:py-2 md:text-base ${
                            atFirstVerse && currentPage > effectiveStartPage
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:pointer-events-none'
                          }`}
                        >
                          {atFirstVerse && currentPage > effectiveStartPage ? (
                            <><span className="md:hidden">← Seite</span><span className="hidden md:inline">← Vorherige Seite</span></>
                          ) : (
                            <><span className="md:hidden">←</span><span className="hidden md:inline">← Vorheriger</span></>
                          )}
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0 md:text-sm">
                          Vers {safeIndex + 1} von {totalVerses}
                        </span>
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={(atLastVerse && currentPage >= effectiveEndPage) || isKahfCompleted}
                          title={atLastVerse && currentPage < effectiveEndPage ? 'Nächste Seite' : 'Nächster Vers'}
                          className={`px-2 py-1.5 text-xs rounded-lg font-medium min-w-0 md:px-4 md:py-2 md:text-base ${
                            atLastVerse && currentPage < effectiveEndPage
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:pointer-events-none'
                          }`}
                        >
                          {atLastVerse && currentPage < effectiveEndPage ? (
                            <><span className="md:hidden">Seite →</span><span className="hidden md:inline">Nächste Seite →</span></>
                          ) : (
                            <><span className="md:hidden">→</span><span className="hidden md:inline">Nächster →</span></>
                          )}
                        </button>
                      </div>
                    </div>
                    <div
                      className="w-2 h-40 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 flex flex-col"
                      aria-label={`Fortschritt: Vers ${safeIndex + 1} von ${totalVerses}`}
                    >
                      <div
                        className="w-full bg-emerald-500 dark:bg-emerald-600 transition-all duration-300 ease-out"
                        style={{ height: `${progressPct}%`, minHeight: progressPct > 0 ? '4px' : undefined }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      </div>

      {mobileAudioOpen && hasAssignmentContext && assignment && (
        <div className="md:hidden fixed bottom-[6.75rem] left-2 right-2 z-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-xl p-2 max-h-[34vh] overflow-y-auto">
          <ReadingAudioCell
            assignmentId={assignment.id}
            assignmentUserId={assignment.user_id}
            audioUrls={normalizeAudioUrls(assignment)}
            canEdit={canEditAudio}
            onSaved={appendAssignmentAudio}
            onDeleted={removeAssignmentAudio}
            showUploadControls={false}
            showPlayers
            compact
          />
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-start items-end">
        {/* Bottom-Bar: Vorheriger | Arabisch | Übersetzung | Nächster | Aufnahme – 1/6 + 1/4 + 1/4 + 1/6 + 1/6, gap-0 */}
        <div className="flex items-end gap-0 pointer-events-auto w-full">
          {/* Vorheriger Vers: 1/6 */}
          <div className="w-1/6 flex items-stretch shrink-0">
            <button
              type="button"
              onClick={goToPreviousVerse}
              className="w-full h-[4.25rem] flex items-center justify-center bg-emerald-400 text-white hover:bg-emerald-500 active:bg-emerald-600 rounded-tl-xl shadow-lg"
              aria-label="Vorheriger Vers"
            >
              <ArrowUp size={24} strokeWidth={3} />
            </button>
          </div>
          {/* Arabisch: 1/4 */}
          <button
            type="button"
            onClick={() => setMode('arabic')}
            disabled={viewLayout === 'verse'}
            className={`w-1/4 shrink-0 h-[4.5rem] rounded-t-xl flex flex-col items-center justify-center pb-1 transition-all border-t border-x border-gray-500/60 ${
              mode === 'arabic' && viewLayout !== 'verse'
                ? 'bg-gray-900 text-gray-100 z-10 -translate-y-1 shadow-lg'
                : 'bg-gray-800 text-gray-400 h-[3.25rem] border-transparent'
            } ${viewLayout === 'verse' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span className="font-quran text-lg leading-none" dir="rtl">أ</span>
          </button>
          {/* Übersetzung: 1/4 */}
          <button
            type="button"
            onClick={() => setMode('translation')}
            disabled={viewLayout === 'verse'}
            className={`w-1/4 shrink-0 h-[4.5rem] rounded-t-xl flex flex-col items-center justify-center pb-1 transition-all border-t border-x border-gray-500/60 ${
              mode === 'translation' && viewLayout !== 'verse'
                ? 'bg-gray-900 text-gray-100 z-10 -translate-y-1 shadow-lg'
                : 'bg-gray-800 text-gray-400 h-[3.25rem] border-transparent'
            } ${viewLayout === 'verse' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span className="font-bold text-base leading-none">A</span>
          </button>
          {/* Nächster Vers: 1/6 */}
          <div className="w-1/6 flex items-stretch shrink-0">
            <button
              type="button"
              onClick={goToNextVerse}
              className="w-full h-[4.25rem] flex items-center justify-center bg-emerald-400 text-white hover:bg-emerald-500 active:bg-emerald-600 shadow-lg"
              aria-label="Nächster Vers"
            >
              <ArrowDown size={24} strokeWidth={3} />
            </button>
          </div>
          {/* Aufnahme: 1/6 – skaliert bei aktiver Aufnahme */}
          <div
            className={`w-1/6 shrink-0 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-500/60 rounded-tl-3xl flex flex-col items-center justify-end py-2 pointer-events-auto shadow-lg transition-all duration-200 ${
              mobileRecording ? 'h-40' : 'h-24'
            }`}
          >
            {loadingAssignment ? (
              <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-500">...</div>
            ) : hasAssignmentContext && assignment ? (
              <ReadingAudioCell
                assignmentId={assignment.id}
                assignmentUserId={assignment.user_id}
                audioUrls={normalizeAudioUrls(assignment)}
                canEdit={canEditAudio}
                onSaved={appendAssignmentAudio}
                onDeleted={removeAssignmentAudio}
                showUploadControls
                showPlayers={false}
                compact
                mobileBar
                mobileAudioOpen={mobileAudioOpen}
                onToggleMobileAudio={() => setMobileAudioOpen((v) => !v)}
                onRecordingChange={(active) => {
                setMobileRecording(active);
                setRecordingContext(active);
              }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-end pb-2 gap-2 opacity-50">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full inline-flex items-center justify-center bg-gray-800 text-gray-500 cursor-not-allowed"
                  aria-label="Aufnahmen anzeigen (deaktiviert)"
                  disabled
                >
                  <ArrowUp size={20} />
                </button>
                <button
                  type="button"
                  className="w-12 h-12 rounded-full inline-flex items-center justify-center bg-gray-700 text-gray-500 cursor-not-allowed"
                  aria-label="Aufnahme starten (deaktiviert)"
                  disabled
                >
                  <Mic size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
