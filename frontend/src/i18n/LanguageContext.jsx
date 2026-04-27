import { createContext, useContext, useState, useEffect } from 'react';
import en from './translations/en';
import fr from './translations/fr';
import ar from './translations/ar';

const translations = { en, fr, ar };
const locales = { en: 'en-US', fr: 'fr-FR', ar: 'ar-SA' };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    if (val !== undefined) return val;
    // Fallback to English
    let fallback = translations.en;
    for (const k of keys) {
      fallback = fallback?.[k];
    }
    return fallback || key;
  };

  const locale = locales[lang] || 'en-US';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, locale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
