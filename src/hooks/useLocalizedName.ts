import { useAuth } from "@/contexts/AuthContext";

/**
 * Business-data display language is a separate, admin-controlled
 * business setting (English / Telugu / Both) — distinct from the
 * application UI language toggle. A record's stored english_name is
 * never mutated by this; it only picks which stored value(s) to
 * *display*, and always falls back to English when Telugu is
 * missing/empty.
 */
export function useLocalizedName(
  englishName: string,
  teluguName: string | null | undefined
): string {
  const { business } = useAuth();
  const mode = business?.name_display_mode ?? "ENGLISH";
  const hasTelugu = !!teluguName && teluguName.trim().length > 0;

  if (mode === "TELUGU" && hasTelugu) {
    return teluguName as string;
  }

  if (mode === "BOTH" && hasTelugu) {
    return `${englishName} — ${teluguName}`;
  }

  return englishName;
}

/**
 * Print-only variant: a physical bill has room for one language, not
 * an "English — Telugu" combination — so unlike the on-screen
 * display mode (which allows BOTH), printed names always resolve to
 * a single language. Driven by its own independent admin-controlled
 * setting (`print_language`), not `name_display_mode` — so staff can
 * see Both/English on screen while the printed bill/PDF always goes
 * out in whichever single language the admin picked for customers.
 */
export function usePrintName(
  englishName: string,
  teluguName: string | null | undefined
): string {
  const { business } = useAuth();
  const printLanguage = business?.print_language ?? "ENGLISH";
  const hasTelugu = !!teluguName && teluguName.trim().length > 0;

  if (printLanguage === "TELUGU" && hasTelugu) {
    return teluguName as string;
  }

  return englishName;
}
