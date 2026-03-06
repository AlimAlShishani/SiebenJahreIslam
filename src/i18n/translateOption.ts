import { OPTION_TRANSLATIONS, OPTION_TRANSLATIONS_RU, OPTION_TRANSLATIONS_TR } from './optionTranslations';

/** Alphabet 1–4: Positionsbegriffe DE → EN (längere zuerst) */
const POSITION_REPLACEMENTS_EN: [string, string][] = [
  ['(Anfang & Allein)', '(Initial & Isolated)'],
  ['(Mitte & Ende)', '(Medial & Final)'],
  ['(Allein & Anfang)', '(Isolated & Initial)'],
  ['(Anfang)', '(Initial)'],
  ['(Ende)', '(Final)'],
  ['(Allein)', '(Isolated)'],
  ['(Mitte)', '(Medial)'],
];

/** Alphabet 1–4: Positionsbegriffe DE → RU */
const POSITION_REPLACEMENTS_RU: [string, string][] = [
  ['(Anfang & Allein)', '(В начале и изолировано)'],
  ['(Mitte & Ende)', '(В середине и в конце)'],
  ['(Allein & Anfang)', '(Изолировано и в начале)'],
  ['(Anfang)', '(В начале)'],
  ['(Ende)', '(В конце)'],
  ['(Allein)', '(Изолировано)'],
  ['(Mitte)', '(В середине)'],
];

/** Alphabet 1–4: Buchstabennamen DE → EN (nur Dschīm → Jīm) */
const LETTER_NAME_REPLACEMENTS_EN: [string, string][] = [
  ['Dschīm', 'Jīm'],
];

/** Alphabet 1–4: Positionsbegriffe DE → TR */
const POSITION_REPLACEMENTS_TR: [string, string][] = [
  ['(Anfang & Allein)', '(Başta ve yalnız)'],
  ['(Mitte & Ende)', '(Ortada ve sonda)'],
  ['(Allein & Anfang)', '(Yalnız ve başta)'],
  ['(Anfang)', '(Başta)'],
  ['(Ende)', '(Sonda)'],
  ['(Allein)', '(Yalnız)'],
  ['(Mitte)', '(Ortada)'],
];

/** Alphabet 1–4: Buchstabennamen DE → RU (längere zuerst, um Teilstrings zu vermeiden) */
const LETTER_NAME_REPLACEMENTS_RU: [string, string][] = [
  ['Dschīm', 'Джим'],
  ['Dhāl', 'Заль'],
  ['Shīn', 'Шин'],
  ['Zāy', 'Зай'],
  ['ʿAyn', 'Айн'],
  ['Ghayn', 'Гайн'],
  ['Thā', 'Са'],
  ['Ṣād', 'Сад'],
  ['Ḍād', 'Dad'],
  ['Ṭā', 'Та'],
  ['Ẓā', 'За'],
  ['Dāl', 'Даль'],
  ['Sīn', 'Син'],
  ['Rā', 'Ра'],
  ['Qāf', 'Каф'],
  ['Kāf', 'Каф'],
  ['Lām', 'Лям'],
  ['Mīm', 'Мим'],
  ['Nūn', 'Нун'],
  ['Wāw', 'Вав'],
  ['Yā', 'Йа'],
  ['Alif', 'Алиф'],
  ['Bā', 'Ба'],
  ['Tā', 'Та'],
  ['Ḥā', 'Ха'],
  ['Khā', 'Ха'],
  ['Fā', 'Фа'],
  ['Hā', 'Ха'],
];

/** Alphabet 1–4: Buchstabennamen DE → TR */
const LETTER_NAME_REPLACEMENTS_TR: [string, string][] = [
  ['Dschīm', 'Cim'],
  ['Dhāl', 'Zel'],
  ['Shīn', 'Şin'],
  ['Zāy', 'Zâ'],
  ['ʿAyn', 'Ayn'],
  ['Ghayn', 'Ğayn'],
  ['Thā', 'Sâ'],
  ['Ṣād', 'Sad'],
  ['Ḍād', 'Dad'],
  ['Ṭā', 'Tı'],
  ['Ẓā', 'Zı'],
  ['Dāl', 'Dal'],
  ['Sīn', 'Sin'],
  ['Rā', 'Râ'],
  ['Qāf', 'Kâf'],
  ['Kāf', 'Kef'],
  ['Lām', 'Lâm'],
  ['Mīm', 'Mîm'],
  ['Nūn', 'Nûn'],
  ['Wāw', 'Vav'],
  ['Yā', 'Yâ'],
  ['Alif', 'Alif'],
  ['Bā', 'Bâ'],
  ['Tā', 'Tâ'],
  ['Ḥā', 'Hâ'],
  ['Khā', 'Hâ'],
  ['Fā', 'Fâ'],
  ['Hā', 'Hâ'],
];

/**
 * Übersetzt eine Antwortoption in die Zielsprache.
 * Bei DE: Originaltext (aus DB, typischerweise Deutsch).
 * Bei EN/RU/TR: Zuerst Positions-Ersetzung (Alphabet 1–4), dann Lookup in OPTION_TRANSLATIONS.
 */
export function translateOptionText(text: string, language: string): string {
  if (!text?.trim()) return text;
  if (language === 'de') return text;
  const translations = language === 'ru' ? OPTION_TRANSLATIONS_RU : language === 'tr' ? OPTION_TRANSLATIONS_TR : OPTION_TRANSLATIONS;
  const positionReplacements = language === 'ru' ? POSITION_REPLACEMENTS_RU : language === 'tr' ? POSITION_REPLACEMENTS_TR : POSITION_REPLACEMENTS_EN;
  const letterReplacements = language === 'ru' ? LETTER_NAME_REPLACEMENTS_RU : language === 'tr' ? LETTER_NAME_REPLACEMENTS_TR : LETTER_NAME_REPLACEMENTS_EN;
  let result = translations[text];
  if (result !== undefined) return result;
  result = text;
  for (const [de, target] of positionReplacements) {
    result = result.replaceAll(de, target);
  }
  if (letterReplacements) {
    for (const [de, target] of letterReplacements) {
      result = result.replaceAll(de, target);
    }
  }
  return result;
}
