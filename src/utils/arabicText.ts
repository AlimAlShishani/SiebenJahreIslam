/**
 * Normalisiert Quranic-Sukoon (U+06E1) auf klassisches Sukoon (U+0652),
 * damit die Darstellung in allen Fonts konsistent als Kreis erscheint.
 */
export function normalizeArabicForDisplay(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\u06E1/g, '\u0652');
}
