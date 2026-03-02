const API_BASE = 'https://api.alquran.cloud/v1';
const CACHE_PREFIX = 'quran_api_cache_v1:';
const DEFAULT_TRANSLATION_EDITION = 'de.aburida';
const FALLBACK_TRANSLATION_EDITIONS = ['de.bubenheim', 'de.khoury', 'en.sahih', 'tr.diyanet'];
const SUPPORTED_TRANSLATION_LANGUAGES = new Set(['de', 'en', 'tr', 'fr', 'ur', 'id', 'es', 'ru', 'it', 'nl']);
const PREFERRED_TRANSLATION_EDITIONS = [
  'de.aburida',
  'de.bubenheim',
  'en.sahih',
  'en.asad',
  'tr.diyanet',
  'fr.hamidullah',
  'ur.jalandhry',
  'id.indonesian',
  'es.cortes',
  'ru.kuliev',
];

export type ReaderMode = 'arabic' | 'translation';

export interface QuranVerse {
  key: string;
  surahNumber: number;
  ayahNumber: number;
  juzNumber: number;
  pageNumber: number;
  arabicText: string;
  translationText: string | null;
}

export interface QuranPageData {
  pageNumber: number;
  juzNumber: number;
  verses: QuranVerse[];
  translationEditionUsed: string;
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  ayahCount: number;
}

export interface TranslationEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
}

const memoryCache = new Map<string, unknown>();

function getFromSession<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setToSession(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // ignore sessionStorage quota errors
  }
}

async function fetchJson<T>(path: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function toVerseKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

export function getDefaultTranslationEdition(): string {
  return DEFAULT_TRANSLATION_EDITION;
}

export async function getTranslationEditions(): Promise<TranslationEdition[]> {
  const cacheKey = 'editions:translations';
  const cachedMemory = memoryCache.get(cacheKey) as TranslationEdition[] | undefined;
  if (cachedMemory) return cachedMemory;
  const cachedSession = getFromSession<TranslationEdition[]>(cacheKey);
  if (cachedSession) {
    memoryCache.set(cacheKey, cachedSession);
    return cachedSession;
  }

  type EditionsResponse = {
    code: number;
    status: string;
    data: Array<{ identifier: string; language: string; name: string; englishName: string }>;
  };

  const response = await fetchJson<EditionsResponse>('/edition?type=translation');
  const byId = new Map<string, TranslationEdition>();
  for (const entry of response.data || []) {
    if (!SUPPORTED_TRANSLATION_LANGUAGES.has(entry.language)) continue;
    if (!byId.has(entry.identifier)) {
      byId.set(entry.identifier, {
        identifier: entry.identifier,
        language: entry.language,
        name: entry.name,
        englishName: entry.englishName,
      });
    }
  }
  const preferredSet = new Set(PREFERRED_TRANSLATION_EDITIONS);
  const editions = Array.from(byId.values()).sort((a, b) => {
    const aPref = PREFERRED_TRANSLATION_EDITIONS.indexOf(a.identifier);
    const bPref = PREFERRED_TRANSLATION_EDITIONS.indexOf(b.identifier);
    if (aPref >= 0 || bPref >= 0) {
      if (aPref < 0) return 1;
      if (bPref < 0) return -1;
      return aPref - bPref;
    }
    if (a.language !== b.language) return a.language.localeCompare(b.language);
    return (a.name || a.englishName).localeCompare(b.name || b.englishName);
  });
  // Stabile, kurze Liste bevorzugter Editionen zuerst, dann Rest.
  const compact = [
    ...editions.filter((e) => preferredSet.has(e.identifier)),
    ...editions.filter((e) => !preferredSet.has(e.identifier)).slice(0, 20),
  ];
  memoryCache.set(cacheKey, compact);
  setToSession(cacheKey, compact);
  return compact;
}

export async function getSurahList(): Promise<SurahMeta[]> {
  const cacheKey = 'surah:list';
  const cachedMemory = memoryCache.get(cacheKey) as SurahMeta[] | undefined;
  if (cachedMemory) return cachedMemory;
  const cachedSession = getFromSession<SurahMeta[]>(cacheKey);
  if (cachedSession) {
    memoryCache.set(cacheKey, cachedSession);
    return cachedSession;
  }

  type SurahResponse = {
    code: number;
    status: string;
    data: Array<{ number: number; name: string; englishName: string; numberOfAyahs: number }>;
  };

  const response = await fetchJson<SurahResponse>('/surah');
  const surahs = (response.data || []).map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    ayahCount: s.numberOfAyahs,
  }));
  memoryCache.set(cacheKey, surahs);
  setToSession(cacheKey, surahs);
  return surahs;
}

export async function getAyahPosition(surahNumber: number, ayahNumber: number): Promise<{ pageNumber: number; juzNumber: number }> {
  const cacheKey = `ayah-pos:${surahNumber}:${ayahNumber}`;
  const cachedMemory = memoryCache.get(cacheKey) as { pageNumber: number; juzNumber: number } | undefined;
  if (cachedMemory) return cachedMemory;
  const cachedSession = getFromSession<{ pageNumber: number; juzNumber: number }>(cacheKey);
  if (cachedSession) {
    memoryCache.set(cacheKey, cachedSession);
    return cachedSession;
  }

  type AyahResponse = {
    code: number;
    status: string;
    data: { page: number; juz: number };
  };

  const response = await fetchJson<AyahResponse>(`/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`);
  const result = { pageNumber: response.data.page, juzNumber: response.data.juz };
  memoryCache.set(cacheKey, result);
  setToSession(cacheKey, result);
  return result;
}

export async function getJuzStartPage(juzNumber: number): Promise<number> {
  const cacheKey = `juz-start:${juzNumber}`;
  const cachedMemory = memoryCache.get(cacheKey) as number | undefined;
  if (typeof cachedMemory === 'number') return cachedMemory;
  const cachedSession = getFromSession<number>(cacheKey);
  if (typeof cachedSession === 'number') {
    memoryCache.set(cacheKey, cachedSession);
    return cachedSession;
  }

  type JuzResponse = {
    code: number;
    status: string;
    data: { ayahs: Array<{ page: number }> };
  };

  const response = await fetchJson<JuzResponse>(`/juz/${juzNumber}/quran-uthmani`);
  const pages = (response.data.ayahs || []).map((a) => a.page);
  const startPage = pages.length > 0 ? Math.min(...pages) : 1;
  memoryCache.set(cacheKey, startPage);
  setToSession(cacheKey, startPage);
  return startPage;
}

async function fetchPageWithEdition(pageNumber: number, edition: string) {
  type PageResponse = {
    code: number;
    status: string;
    data: {
      number: number;
      ayahs: Array<{
        text: string;
        numberInSurah: number;
        juz: number;
        page: number;
        surah: { number: number };
      }>;
    };
  };
  return fetchJson<PageResponse>(`/page/${pageNumber}/${edition}`);
}

export async function getQuranPage(pageNumber: number, translationEdition = DEFAULT_TRANSLATION_EDITION): Promise<QuranPageData> {
  const safePage = Math.max(1, Math.min(604, Number(pageNumber) || 1));
  const cacheKey = `page:${safePage}:${translationEdition}`;
  const cachedMemory = memoryCache.get(cacheKey) as QuranPageData | undefined;
  if (cachedMemory) return cachedMemory;
  const cachedSession = getFromSession<QuranPageData>(cacheKey);
  if (cachedSession) {
    memoryCache.set(cacheKey, cachedSession);
    return cachedSession;
  }

  const arabicPromise = fetchPageWithEdition(safePage, 'quran-uthmani');
  const translationCandidates = [translationEdition, ...FALLBACK_TRANSLATION_EDITIONS].filter(
    (item, idx, arr) => arr.indexOf(item) === idx
  );

  const arabicPage = await arabicPromise;
  let translationPage: Awaited<ReturnType<typeof fetchPageWithEdition>> | null = null;
  let usedEdition = translationEdition;

  for (const candidate of translationCandidates) {
    try {
      translationPage = await fetchPageWithEdition(safePage, candidate);
      usedEdition = candidate;
      break;
    } catch {
      // try next translation
    }
  }

  const translationMap = new Map<string, string>();
  if (translationPage?.data?.ayahs) {
    for (const ayah of translationPage.data.ayahs) {
      const key = toVerseKey(ayah.surah.number, ayah.numberInSurah);
      translationMap.set(key, ayah.text);
    }
  }

  const verses: QuranVerse[] = (arabicPage.data.ayahs || []).map((ayah) => {
    const key = toVerseKey(ayah.surah.number, ayah.numberInSurah);
    return {
      key,
      surahNumber: ayah.surah.number,
      ayahNumber: ayah.numberInSurah,
      juzNumber: ayah.juz,
      pageNumber: ayah.page,
      arabicText: ayah.text,
      translationText: translationMap.get(key) ?? null,
    };
  });

  const result: QuranPageData = {
    pageNumber: safePage,
    juzNumber: verses[0]?.juzNumber ?? 1,
    verses,
    translationEditionUsed: usedEdition,
  };

  memoryCache.set(cacheKey, result);
  setToSession(cacheKey, result);
  return result;
}
