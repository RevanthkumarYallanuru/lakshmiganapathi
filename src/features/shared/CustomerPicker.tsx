import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Languages, User, X } from "lucide-react";

import { listCustomers } from "@/api/endpoints/customers";
import { queryKeys } from "@/api/queryKeys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Customer } from "@/types";

function CustomerOptionLabel({
  customer,
  override,
}: {
  customer: Customer;
  override?: "en" | "te" | null;
}) {
  const defaultName = useLocalizedName(customer.english_name, customer.telugu_name);
  const name =
    override === "te" && customer.telugu_name
      ? customer.telugu_name
      : override === "en"
        ? customer.english_name
        : defaultName;

  return (
    <div>
      <p className="text-sm font-medium text-slate-800">{name}</p>
      <p className="text-xs text-slate-400">
        {customer.customer_code}
        {customer.phone ? ` · ${customer.phone}` : ""}
      </p>
    </div>
  );
}

/**
 * A dependency-free searchable customer picker: type to filter, click
 * a result to select. Selecting shows a chip with a Change action
 * rather than a native <select> — there can be ~200 customers, too
 * many for a plain dropdown to stay usable.
 */
export function CustomerPicker({
  value,
  onChange,
  label,
}: {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  label?: string;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [nameOverride, setNameOverride] = useState<"en" | "te" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query);

  // A fresh selection starts from the business's default display
  // again — the override is a convenience for the *current* customer
  // on this bill, not a setting that should leak onto the next one.
  useEffect(() => {
    setNameOverride(null);
  }, [value?.id]);

  // Billing must never let a bill be raised against a deactivated
  // customer — only active customers are selectable here, unlike the
  // Customers admin page which intentionally lists everyone so
  // inactive accounts can still be found and reactivated.
  const { data } = useQuery({
    queryKey: queryKeys.customers.list(debounced, true),
    queryFn: () => listCustomers(debounced || undefined, true),
    enabled: open,
  });

  const results = (data?.data ?? []).slice(0, 20);

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <span className="text-sm font-medium text-slate-700">{label}</span>
        )}
        <div className="flex items-center justify-between rounded-control border border-slate-300 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" aria-hidden />
            <CustomerOptionLabel customer={value} override={nameOverride} />
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
        placeholder={t("picker.searchCustomer")}
        className="h-10 rounded-control border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1"
      />
      {open && (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-card border border-slate-200 bg-white p-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">
              {t("picker.noMatches")}
            </p>
          ) : (
            results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(customer);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent-50"
              >
                <CustomerOptionLabel customer={customer} />
                <Check className="h-4 w-4 text-transparent" aria-hidden />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
