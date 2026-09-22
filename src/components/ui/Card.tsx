import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-slate-200 bg-white p-4 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {action}
    </div>
  );
}
