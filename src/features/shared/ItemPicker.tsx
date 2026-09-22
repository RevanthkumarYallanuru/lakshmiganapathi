import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

import { listItems } from "@/api/endpoints/items";
import { queryKeys } from "@/api/queryKeys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Item } from "@/types";

function ItemOptionLabel({ item }: { item: Item }) {
  const name = useLocalizedName(item.english_name, item.telugu_name);
  return (
    <div>
      <p className="text-sm font-medium text-slate-800">{name}</p>
      <p className="text-xs text-slate-400">{item.item_code}</p>
    </div>
  );
}

/** Same dependency-free search-to-select pattern as CustomerPicker,
 * used for each item row in the billing workspace. */
export function ItemPicker({ onSelect }: { onSelect: (item: Item) => void }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query);

  const { data } = useQuery({
    queryKey: queryKeys.items.list({ search: debounced }),
    queryFn: () => listItems({ search: debounced || undefined }),
    enabled: open,
  });

  const results = (data?.data ?? []).slice(0, 20);

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t("picker.searchItem")}
        className="h-10 w-full rounded-control border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1"
      />
      {open && (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full min-w-64 overflow-y-auto rounded-card border border-slate-200 bg-white p-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">
              {t("picker.noMatches")}
            </p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(item);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-accent-50"
              >
                <Package className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <ItemOptionLabel item={item} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
