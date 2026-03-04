import { OPTION_TRANSLATIONS } from './optionTranslations';

/** Alphabet 1–4: Positionsbegriffe DE → EN (längere zuerst) */
const POSITION_REPLACEMENTS: [string, string][] = [
  ['(Anfang & Allein)', '(Initial & Isolated)'],
  ['(Mitte & Ende)', '(Medial & Final)'],
  ['(Allein & Anfang)', '(Isolated & Initial)'],
  ['(Anfang)', '(Initial)'],
  ['(Ende)', '(Final)'],
  ['(Allein)', '(Isolated)'],
  ['(Mitte)', '(Medial)'],
];

/**
 * Übersetzt eine Antwortoption in die Zielsprache.
 * Bei DE: Originaltext (aus DB, typischerweise Deutsch).
 * Bei EN: Zuerst Positions-Ersetzung (Alphabet 1–4), dann Lookup in OPTION_TRANSLATIONS.
 */
export function translateOptionText(text: string, language: string): string {
  if (!text?.trim()) return text;
  if (language === 'de') return text;
  let result = OPTION_TRANSLATIONS[text];
  if (result !== undefined) return result;
  result = text;
  for (const [de, en] of POSITION_REPLACEMENTS) {
    result = result.replaceAll(de, en);
  }
  return result;
}
