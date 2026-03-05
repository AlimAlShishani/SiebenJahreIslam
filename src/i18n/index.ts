import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';

const STORAGE_KEY = 'nuruna-lang';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
const initialLang = (savedLang === 'de' || savedLang === 'en' || savedLang === 'ru' || savedLang === 'tr') ? savedLang : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de }, ru: { translation: ru }, tr: { translation: tr } },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const changeLanguage = (lang: 'en' | 'de' | 'ru' | 'tr') => {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
};

export default i18n;
