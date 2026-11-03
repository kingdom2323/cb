import { useState, useEffect, useCallback } from 'react';
import { Language, Translations, TRANSLATIONS } from './translations';

const LANG_STORAGE_KEY = 'kvk_roster_language';

const DEFAULT_LANG: Language = 'EN';

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && (saved === 'EN' || saved === 'FR' || saved === 'ES' || saved === 'PT')) {
      return saved as Language;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANG;
}

// Global language state so all consumers share it without context
let globalLang: Language = getSavedLanguage();
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function setGlobalLanguage(lang: Language) {
  globalLang = lang;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  notifyListeners();
}

export function useTranslation(): { t: Translations; lang: Language; setLang: (l: Language) => void } {
  const [lang, setLangState] = useState<Language>(globalLang);

  useEffect(() => {
    const handler = () => setLangState(globalLang);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const setLang = useCallback((l: Language) => {
    setGlobalLanguage(l);
  }, []);

  return { t: TRANSLATIONS[lang], lang, setLang };
}
