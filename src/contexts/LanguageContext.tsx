import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  dictionaries,
  LANGUAGE_STORAGE_KEY,
  type Language,
  type TranslationKey,
} from "@/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Falls back to the English value, then the raw key, if a Telugu
   * translation is missing — a translation gap must never blank out
   * the UI. */
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "te") return stored;
  } catch {
    // localStorage unavailable — fall back silently.
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Not persisted this session; the app still works.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return (
        dictionaries[language][key] ?? dictionaries.en[key] ?? String(key)
      );
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
