import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Languages, Store, X } from "lucide-react";

import { listSuppliers } from "@/api/endpoints/suppliers";
import { queryKeys } from "@/api/queryKeys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Supplier } from "@/types";

function SupplierOptionLabel({
  supplier,
  override,
}: {
  supplier: Supplier;
  override?: "en" | "te" | null;
}) {
  const defaultName = useLocalizedName(supplier.name, supplier.telugu_name);
  const name =
    override === "te" && supplier.telugu_name
      ? supplier.telugu_name
      : override === "en"
        ? supplier.name
        : defaultName;

  return (
    <div>
      <p className="text-sm font-medium text-slate-800">{name}</p>
      {(supplier.organization || supplier.phone) && (
        <p className="text-xs text-slate-400">
          {supplier.organization}
          {supplier.organization && supplier.phone ? " · " : ""}
          {supplier.phone}
        </p>
      )}
    </div>
  );
}

/** Same dependency-free searchable picker as CustomerPicker — type to
 * filter, click a result to select, a chip with a Change action once
 * selected. Used everywhere a My Pay or Import needs a mandatory
 * supplier link instead of free text. */
export function SupplierPicker({
  value,
  onChange,
  label,
}: {
  value: Supplier | null;
  onChange: (supplier: Supplier | null) => void;
  label?: string;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [nameOverride, setNameOverride] = useState<"en" | "te" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query);

  useEffect(() => {
    setNameOverride(null);
  }, [value?.id]);

  // Only active suppliers are selectable here — inactive ones can
  // still be found/reactivated from the Suppliers admin page itself.
  const { data } = useQuery({
    queryKey: queryKeys.suppliers.list(debounced, true),
    queryFn: () => listSuppliers(debounced || undefined, true),
    enabled: open,
  });

  // Every match is shown (the list scrolls) — never a truncated slice.
  const results = data?.data ?? [];

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <span className="text-sm font-medium text-slate-700">{label}</span>
        )}
        <div className="flex items-center justify-between rounded-control border border-slate-300 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-slate-400" aria-hidden />
            <SupplierOptionLabel supplier={value} override={nameOverride} />
          </div>
          <div className="flex items-center gap-1">
            {value.telugu_name?.trim() && (
              <button
                type="button"
                onClick={() =>
                  setNameOverride((prev) => (prev === "te" ? "en" : "te"))
                }
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title={t("picker.toggleNameLanguage")}
                aria-label={t("picker.toggleNameLanguage")}
              >
                <Languages className="h-4 w-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={t("picker.change")}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t("picker.searchSupplier")}
        className="h-10 rounded-control border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1"
      />
      {open && (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-card border border-slate-200 bg-white p-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">
              {t("picker.noMatches")}
            </p>
          ) : (
            results.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(supplier);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent-50"
              >
                <SupplierOptionLabel supplier={supplier} />
                <Check className="h-4 w-4 text-transparent" aria-hidden />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
