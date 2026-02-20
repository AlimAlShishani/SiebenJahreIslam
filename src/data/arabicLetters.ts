/**
 * Arabische Buchstaben mit Unicode-Präsentationsformen
 * (alleine, Anfang, Mitte, Ende)
 * Einige Buchstaben (ا د ذ ر ز و) verbinden sich nicht nach links → nur 2 Formen.
 */
function cp(hex: number): string {
  return String.fromCodePoint(hex);
}

export interface ArabicLetterForm {
  name: string;
  nameDe: string;
  isolated: string;
  initial: string | null;
  medial: string | null;
  final: string;
}

export const arabicLetters: ArabicLetterForm[] = [
  { name: 'alif',     nameDe: 'Alif',     isolated: cp(0xFE8D), initial: null,  medial: null,  final: cp(0xFE8E) },
  { name: 'bāʾ',      nameDe: 'Bā',       isolated: cp(0xFE8F), initial: cp(0xFE91), medial: cp(0xFE92), final: cp(0xFE90) },
  { name: 'tāʾ',      nameDe: 'Tā',       isolated: cp(0xFE95), initial: cp(0xFE97), medial: cp(0xFE98), final: cp(0xFE96) },
  { name: 'thāʾ',     nameDe: 'Thā',      isolated: cp(0xFE99), initial: cp(0xFE9B), medial: cp(0xFE9C), final: cp(0xFE9A) },
  { name: 'jīm',      nameDe: 'Dschīm',   isolated: cp(0xFE9D), initial: cp(0xFE9F), medial: cp(0xFEA0), final: cp(0xFE9E) },
  { name: 'ḥāʾ',      nameDe: 'Ḥā',       isolated: cp(0xFEA1), initial: cp(0xFEA3), medial: cp(0xFEA4), final: cp(0xFEA2) },
  { name: 'khāʾ',     nameDe: 'Khā',      isolated: cp(0xFEA5), initial: cp(0xFEA7), medial: cp(0xFEA8), final: cp(0xFEA6) },
  { name: 'dāl',      nameDe: 'Dāl',      isolated: cp(0xFEA9), initial: null,  medial: null,  final: cp(0xFEAA) },
  { name: 'dhāl',     nameDe: 'Dhāl',     isolated: cp(0xFEAB), initial: null,  medial: null,  final: cp(0xFEAC) },
  { name: 'rāʾ',      nameDe: 'Rā',       isolated: cp(0xFEAD), initial: null,  medial: null,  final: cp(0xFEAE) },
  { name: 'zāy',      nameDe: 'Zāy',      isolated: cp(0xFEAF), initial: null,  medial: null,  final: cp(0xFEB0) },
  { name: 'sīn',      nameDe: 'Sīn',      isolated: cp(0xFEB1), initial: cp(0xFEB3), medial: cp(0xFEB4), final: cp(0xFEB2) },
  { name: 'shīn',     nameDe: 'Schīn',    isolated: cp(0xFEB5), initial: cp(0xFEB7), medial: cp(0xFEB8), final: cp(0xFEB6) },
  { name: 'ṣād',      nameDe: 'Ṣād',      isolated: cp(0xFEB9), initial: cp(0xFEBB), medial: cp(0xFEBC), final: cp(0xFEBA) },
  { name: 'ḍād',      nameDe: 'Ḍād',      isolated: cp(0xFEBD), initial: cp(0xFEBF), medial: cp(0xFEC0), final: cp(0xFEBE) },
  { name: 'ṭāʾ',      nameDe: 'Ṭā',       isolated: cp(0xFEC1), initial: cp(0xFEC3), medial: cp(0xFEC4), final: cp(0xFEC2) },
  { name: 'ẓāʾ',      nameDe: 'Ẓā',       isolated: cp(0xFEC5), initial: cp(0xFEC7), medial: cp(0xFEC8), final: cp(0xFEC6) },
  { name: 'ʿayn',     nameDe: 'ʿAyn',     isolated: cp(0xFEC9), initial: cp(0xFECB), medial: cp(0xFECC), final: cp(0xFECA) },
  { name: 'ghayn',    nameDe: 'Ghayn',    isolated: cp(0xFECD), initial: cp(0xFECF), medial: cp(0xFED0), final: cp(0xFECE) },
  { name: 'fāʾ',      nameDe: 'Fā',       isolated: cp(0xFED1), initial: cp(0xFED3), medial: cp(0xFED4), final: cp(0xFED2) },
  { name: 'qāf',      nameDe: 'Qāf',      isolated: cp(0xFED5), initial: cp(0xFED7), medial: cp(0xFED8), final: cp(0xFED6) },
  { name: 'kāf',      nameDe: 'Kāf',      isolated: cp(0xFED9), initial: cp(0xFEDB), medial: cp(0xFEDC), final: cp(0xFEDA) },
  { name: 'lām',      nameDe: 'Lām',      isolated: cp(0xFEDD), initial: cp(0xFEDF), medial: cp(0xFEE0), final: cp(0xFEDE) },
  { name: 'mīm',      nameDe: 'Mīm',      isolated: cp(0xFEE1), initial: cp(0xFEE3), medial: cp(0xFEE4), final: cp(0xFEE2) },
  { name: 'nūn',      nameDe: 'Nūn',      isolated: cp(0xFEE5), initial: cp(0xFEE7), medial: cp(0xFEE8), final: cp(0xFEE6) },
  { name: 'hāʾ',      nameDe: 'Hā',       isolated: cp(0xFEE9), initial: cp(0xFEEB), medial: cp(0xFEEC), final: cp(0xFEEA) },
  { name: 'wāw',      nameDe: 'Wāw',      isolated: cp(0xFEED), initial: null,  medial: null,  final: cp(0xFEEE) },
  { name: 'yāʾ',      nameDe: 'Yā',       isolated: cp(0xFEF1), initial: cp(0xFEF3), medial: cp(0xFEF4), final: cp(0xFEF2) },
];
