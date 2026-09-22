import { Languages } from "lucide-react";

import { suggestTeluguVariants } from "@/lib/transliterate";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * "Suggested: [రమేష్] [రమేశ్] [రమేష్ కుమార్]" — shown under a Telugu
 * Name field whenever the English name isn't empty. Purely offline,
 * local string processing (no API call, so no debounce is needed —
 * recomputing on every keystroke is effectively free). Every chip is
 * a suggestion only: clicking one fills the field but never locks it,
 * the user can keep editing or type their own value instead.
 */
export function TeluguSuggestion({
  englishValue,
  onAccept,
}: {
  englishValue: string;
  onAccept: (value: string) => void;
}) {
  const { t } = useLanguage();
  const suggestions = suggestTeluguVariants(englishValue);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      <Languages className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      <span>{t("picker.suggested")}:</span>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onAccept(suggestion)}
          className="rounded-control border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
