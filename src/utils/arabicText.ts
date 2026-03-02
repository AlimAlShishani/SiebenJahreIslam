/**
 * Sehr gezielte Normalisierung:
 * - In Formen wie "أُو۟لَٰٓئِكَ" soll nur das kleine Zeichen auf Waw/Alif
 *   als normales Sukoon gerendert werden.
 * - Quranic-Sukoon (U+06E1, z.B. "مُعۡجِزِينَ") bleibt unverändert.
 */
export function normalizeArabicForDisplay(value: string | null | undefined): string {
  if (!value) return '';
  return value
    // Nur Waw/Alif mit U+06DF normalisieren (nicht global).
    .replace(/([\u0648\u0627])\u06DF/g, '$1\u0652')
    // Falls API/Quelle an dieser Stelle normales Sukoon liefert, auf Quranic-Sukoon
    // für die bekannte Form mit Ayn angleichen (z.B. مُعۡجِزِينَ).
    .replace(/\u0639\u0652/g, '\u0639\u06E1');
}
