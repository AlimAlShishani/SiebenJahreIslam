/**
 * Teilt arabischen Text in „Buchstaben“ (Basis + Tashkeel) und optional
 * in Anzeige-Blöcke (Buchstaben mit Index für Klick, Leerzeichen ohne).
 */

export type DisplayRun = { text: string; letterIndex?: number };

/**
 * Zerlegt text in Anzeige-Blöcke: jeder Block ist entweder
 * ein Buchstabe (Basis + kombinierende Zeichen) mit letterIndex 0,1,2,…
 * oder Leerzeichen/andere Zeichen ohne letterIndex.
 */
export function splitArabicIntoDisplayRuns(text: string): DisplayRun[] {
  const display: DisplayRun[] = [];
  let letterIndex = 0;
  const re = /\p{L}\p{M}*/gu;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastEnd) {
      display.push({ text: text.slice(lastEnd, m.index) });
    }
    display.push({ text: m[0], letterIndex: letterIndex++ });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < text.length) {
    display.push({ text: text.slice(lastEnd) });
  }
  return display;
}

/**
 * Run inkl. Zeichen-Offsets im Originaltext (für Range-API / Overlay-Messung).
 */
export type RunWithOffset = { text: string; letterIndex?: number; start: number; end: number };

/**
 * Wie splitArabicIntoDisplayRuns, plus start/end (Zeichenoffset im Text).
 */
export function getRunsWithOffsets(text: string): RunWithOffset[] {
  const runs: RunWithOffset[] = [];
  let letterIndex = 0;
  const re = /\p{L}\p{M}*/gu;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastEnd) {
      runs.push({ text: text.slice(lastEnd, m.index), start: lastEnd, end: m.index });
    }
    runs.push({ text: m[0], letterIndex: letterIndex++, start: m.index, end: m.index + m[0].length });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < text.length) {
    runs.push({ text: text.slice(lastEnd), start: lastEnd, end: text.length });
  }
  return runs;
}

/**
 * Liefert nur die Buchstaben-Segmente (ohne Leerzeichen), um die Anzahl zu kennen.
 */
export function getLetterCount(text: string): number {
  const re = /\p{L}\p{M}*/gu;
  let count = 0;
  while (re.exec(text) !== null) count++;
  return count;
}
