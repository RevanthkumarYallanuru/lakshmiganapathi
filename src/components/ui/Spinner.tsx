import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-accent-600", className)}
      aria-hidden
    />
  );
}

/** Full-region loading state — the one pattern every list/detail
 * screen uses instead of a blank screen while data loads. */
export function LoadingState({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-slate-500"
      role="status"
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
