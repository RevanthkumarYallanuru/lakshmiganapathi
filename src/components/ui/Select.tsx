import { useId } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  optional?: boolean;
  disabled?: boolean;
}

/** Accessible Select built on Radix — keyboard nav, focus trapping,
 * and ARIA wiring come for free instead of being hand-rolled. */
export function Select({
  label,
  placeholder = "Select...",
  value,
  onValueChange,
  options,
  error,
  optional,
  disabled,
}: SelectProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              (optional)
            </span>
          )}
        </label>
      )}
      <RadixSelect.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={id}
          className={cn(
            "flex h-10 items-center justify-between gap-2 rounded-control border border-slate-300 bg-white px-3 text-sm text-slate-900",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1",
            "disabled:bg-slate-50 disabled:text-slate-400",
            "data-[placeholder]:text-slate-400",
            error && "border-danger-500"
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 max-h-72 overflow-hidden rounded-card border border-slate-200 bg-white shadow-lg"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-400">
                  No options
                </div>
              )}
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm text-slate-900",
                    "data-[highlighted]:bg-accent-50 data-[highlighted]:outline-none",
                    "data-[state=checked]:font-medium"
                  )}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator>
                    <Check className="h-4 w-4 text-accent-600" aria-hidden />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
