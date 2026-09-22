import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "danger" | "warning" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-success-100 text-success-700",
  danger: "bg-danger-100 text-danger-700",
  warning: "bg-warning-100 text-warning-700",
  accent: "bg-accent-100 text-accent-700",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
