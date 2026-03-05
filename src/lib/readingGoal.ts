/**
 * Hilfsfunktionen für Leseziele (Juz, Seite, Sura, Aya) und Fortschrittsberechnung.
 */
import { getJuzStartPage, getAyahPosition } from './quranApi';

export type GoalUnit = 'juz' | 'page' | 'aya';

export interface GoalRange {
  from: number;
  to: number;
  unit: GoalUnit;
}

export interface GoalPageRange {
  startPage: number;
  endPage: number;
}

/** Aya: from/to = surahNum * 1000 + ayahNum (z.B. 2:255 = 2255) */
export function encodeAyaRef(surah: number, ayah: number): number {
  return surah * 1000 + ayah;
}

export function decodeAyaRef(encoded: number): { surah: number; ayah: number } {
  return { surah: Math.floor(encoded / 1000), ayah: encoded % 1000 };
}

/** Konvertiert ein Ziel (Juz/Seite/Sura/Aya) in Start- und Endseite. */
export async function goalToPageRange(goal: GoalRange): Promise<GoalPageRange | null> {
  const { from, to, unit } = goal;
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return null;

  switch (unit) {
    case 'juz': {
      const startPage = await getJuzStartPage(from);
      const endJuz = Math.min(30, to);
      const nextStart = endJuz < 30 ? await getJuzStartPage(endJuz + 1) : 605;
      const endPage = nextStart - 1;
      return { startPage, endPage };
    }
    case 'page':
      return { startPage: Math.max(1, from), endPage: Math.min(604, to) };
    case 'aya': {
      const { surah: fromSurah, ayah: fromAyah } = decodeAyaRef(from);
      const { surah: toSurah, ayah: toAyah } = decodeAyaRef(to);
      const startPos = await getAyahPosition(fromSurah, fromAyah);
      const endPos = await getAyahPosition(toSurah, toAyah);
      return { startPage: startPos.pageNumber, endPage: endPos.pageNumber };
    }
    default:
      return null;
  }
}

/** Formatiert ein Ziel für die Anzeige (z.B. "Juz 3–5" oder "Seite 282–284"). */
export function formatGoalLabel(goal: GoalRange): string {
  const { from, to, unit } = goal;
  switch (unit) {
    case 'juz':
      return from === to ? `Juz ${from}` : `Juz ${from}–${to}`;
    case 'page':
      return from === to ? `Seite ${from}` : `Seite ${from}–${to}`;
    case 'aya': {
      const f = decodeAyaRef(from);
      const t = decodeAyaRef(to);
      if (f.surah === t.surah && f.ayah === t.ayah) return `${f.surah}:${f.ayah}`;
      return `${f.surah}:${f.ayah} – ${t.surah}:${t.ayah}`;
    }
    default:
      return `${from}–${to}`;
  }
}

/** Berechnet Fortschritt (0–100) basierend auf aktueller Seite und Zielbereich. */
export function calculatePageProgress(
  currentPage: number,
  startPage: number,
  endPage: number,
  verseFractionInPage = 0
): number {
  if (startPage > endPage) return 0;
  const totalPages = endPage - startPage + 1;
  if (currentPage < startPage) return 0;
  if (currentPage > endPage) return 100;
  const pagesRead = currentPage - startPage + verseFractionInPage;
  return Math.min(100, Math.max(0, (pagesRead / totalPages) * 100));
}
