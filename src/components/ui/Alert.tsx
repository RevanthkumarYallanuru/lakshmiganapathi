import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const toneConfig: Record<
  Tone,
  { icon: typeof Info; className: string }
> = {
  info: { icon: Info, className: "bg-accent-50 text-accent-800 border-accent-200" },
  success: { icon: CheckCircle2, className: "bg-success-50 text-success-700 border-success-100" },
  warning: { icon: AlertTriangle, className: "bg-warning-50 text-warning-700 border-warning-100" },
  danger: { icon: XCircle, className: "bg-danger-50 text-danger-700 border-danger-100" },
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const { icon: Icon, className } = toneConfig[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-card border px-3 py-2.5 text-sm",
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
