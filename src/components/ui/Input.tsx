import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, optional, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {optional && (
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                (optional)
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 rounded-control border border-slate-300 bg-white px-3 text-sm text-slate-900",
            "placeholder:text-slate-400",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1",
            "disabled:bg-slate-50 disabled:text-slate-400",
            error && "border-danger-500",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
