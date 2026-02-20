/**
 * Arabische Buchstaben – Schreibweisen mit Basis-Unicode + Tatweel (ـ U+0640)
 * wie in der Wikipedia-Tabelle „Arabic alphabet“ (Contextual forms).
 * Buchstaben ا د ذ ر ز و verbinden sich nicht nach links → gleiche Form für Anfang/Mitte/Ende (wird wiederholt).
 */
const TATWEEL = '\u0640'; // ـ

function cp(hex: number): string {
  return String.fromCodePoint(hex);
}

function forms(
  base: number,
  connecting: boolean
): { isolated: string; initial: string | null; medial: string | null; final: string } {
  const char = cp(base);
  const finalForm = TATWEEL + char;
  if (!connecting) {
    return { isolated: char, initial: char, medial: finalForm, final: finalForm };
  }
  return {
    isolated: char,
    initial: char + TATWEEL,
    medial: TATWEEL + char + TATWEEL,
    final: finalForm,
  };
}

export interface ArabicLetterForm {
  name: string;
  nameDe: string;
  isolated: string;
  initial: string | null;
  medial: string | null;
  final: string;
}

// Basis-Arabisch U+0627–U+064A (Wikipedia / Unicode block)
export const arabicLetters: ArabicLetterForm[] = [
  { name: 'alif',     nameDe: 'Alif',     ...forms(0x0627, false) },
  { name: 'bāʾ',      nameDe: 'Bā',       ...forms(0x0628, true) },
  { name: 'tāʾ',      nameDe: 'Tā',       ...forms(0x062A, true) },
  { name: 'thāʾ',     nameDe: 'Thā',      ...forms(0x062B, true) },
  { name: 'jīm',      nameDe: 'Dschīm',  ...forms(0x062C, true) },
  { name: 'ḥāʾ',      nameDe: 'Ḥā',       ...forms(0x062D, true) },
  { name: 'khāʾ',     nameDe: 'Khā',      ...forms(0x062E, true) },
  { name: 'dāl',      nameDe: 'Dāl',      ...forms(0x062F, false) },
  { name: 'dhāl',     nameDe: 'Dhāl',     ...forms(0x0630, false) },
  { name: 'rāʾ',      nameDe: 'Rā',       ...forms(0x0631, false) },
  { name: 'zāy',      nameDe: 'Zāy',     ...forms(0x0632, false) },
  { name: 'sīn',      nameDe: 'Sīn',     ...forms(0x0633, true) },
  { name: 'shīn',     nameDe: 'Shīn',    ...forms(0x0634, true) },
  { name: 'ṣād',      nameDe: 'Ṣād',     ...forms(0x0635, true) },
  { name: 'ḍād',      nameDe: 'Ḍād',     ...forms(0x0636, true) },
  { name: 'ṭāʾ',      nameDe: 'Ṭā',      ...forms(0x0637, true) },
  { name: 'ẓāʾ',      nameDe: 'Ẓā',      ...forms(0x0638, true) },
  { name: 'ʿayn',     nameDe: 'ʿAyn',    ...forms(0x0639, true) },
  { name: 'ghayn',    nameDe: 'Ghayn',   ...forms(0x063A, true) },
  { name: 'fāʾ',      nameDe: 'Fā',      ...forms(0x0641, true) },
  { name: 'qāf',      nameDe: 'Qāf',     ...forms(0x0642, true) },
  { name: 'kāf',      nameDe: 'Kāf',     ...forms(0x0643, true) },
  { name: 'lām',      nameDe: 'Lām',     ...forms(0x0644, true) },
  { name: 'mīm',      nameDe: 'Mīm',     ...forms(0x0645, true) },
  { name: 'nūn',      nameDe: 'Nūn',     ...forms(0x0646, true) },
  { name: 'hāʾ',      nameDe: 'Hā',      ...forms(0x0647, true) },
  { name: 'wāw',      nameDe: 'Wāw',     ...forms(0x0648, false) },
  { name: 'yāʾ',      nameDe: 'Yā',      ...forms(0x064A, true) },
];
