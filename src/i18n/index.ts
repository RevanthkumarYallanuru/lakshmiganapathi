import en from "./en.json";
import te from "./te.json";

export type Language = "en" | "te";
export type TranslationKey = keyof typeof en;

export const dictionaries: Record<Language, Record<string, string>> = {
  en,
  te,
};

export const LANGUAGE_STORAGE_KEY = "lge_language";

export const SUPPORTED_LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "te", label: "తెలుగు" },
];
