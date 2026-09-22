import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-10 w-full rounded-control border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900",
          "placeholder:text-slate-400",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1"
        )}
      />
    </div>
  );
}
