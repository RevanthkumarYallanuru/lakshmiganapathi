import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Icon className="h-8 w-8 text-slate-300" aria-hidden />
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && (
        <p className="text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
