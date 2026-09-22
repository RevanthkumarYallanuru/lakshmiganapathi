import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-600 text-white hover:bg-accent-700 focus-visible:outline-accent-600 disabled:bg-accent-300",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

/**
 * The one button component used everywhere. `loading` disables the
 * button and shows a spinner — the shared mechanism for preventing
 * double-submission of bills, payments, and other mutations.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-control font-medium transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
