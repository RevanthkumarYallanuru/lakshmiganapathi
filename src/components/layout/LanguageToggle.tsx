import { useLanguage } from "@/contexts/LanguageContext";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="inline-flex rounded-control border border-slate-200 bg-slate-50 p-0.5 text-sm"
      role="group"
      aria-label="Application language"
    >
      {SUPPORTED_LANGUAGES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          className={cn(
            "rounded px-2.5 py-1 font-medium transition-colors",
            language === option.value
              ? "bg-white text-accent-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
