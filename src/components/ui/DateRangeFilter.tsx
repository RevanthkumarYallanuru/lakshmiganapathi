import { useMemo, useState } from "react";

import type { ReportRange } from "@/api/endpoints/reports";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";

const RANGE_OPTIONS: { value: ReportRange; labelKey: TranslationKey }[] = [
  { value: "all", labelKey: "common.allTime" },
  { value: "today", labelKey: "common.today" },
  { value: "last3days", labelKey: "common.last3Days" },
  { value: "week", labelKey: "common.last7Days" },
  { value: "last30days", labelKey: "common.last30Days" },
  { value: "month", labelKey: "common.thisMonth" },
  { value: "year", labelKey: "common.thisYear" },
  { value: "custom", labelKey: "common.customRange" },
];

export interface DateRangeParams {
  range?: ReportRange;
  start_date?: string;
  end_date?: string;
}

/** State for a list's quick date filter. `params` is ready to spread
 * into a list query ("all" sends nothing, i.e. no date filter);
 * `ready` is false while Custom is chosen but its dates aren't both
 * filled in yet — pass it as the query's `enabled` so half-typed dates
 * never hit the API. */
export function useDateRangeFilter(initial: ReportRange = "all") {
  const [range, setRange] = useState<ReportRange>(initial);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const ready = range !== "custom" || (!!startDate && !!endDate);

  const params = useMemo<DateRangeParams>(() => {
    if (range === "all") return {};
    if (range === "custom") {
      return { range, start_date: startDate, end_date: endDate };
    }
    return { range };
  }, [range, startDate, endDate]);

  return { range, startDate, endDate, setRange, setStartDate, setEndDate, ready, params };
}

export type DateRangeFilterState = ReturnType<typeof useDateRangeFilter>;

/** One shared Today / Last 3 days / Last 7 days / Last 30 days / This
 * month / This year / All time / Custom selector used by every
 * transactional list. */
export function DateRangeFilter({ filter }: { filter: DateRangeFilterState }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filter.range}
        onValueChange={(value) => filter.setRange(value as ReportRange)}
        options={RANGE_OPTIONS.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
      />
      {filter.range === "custom" && (
        <>
          <input
            type="date"
            aria-label={t("common.from")}
            value={filter.startDate}
            onChange={(event) => filter.setStartDate(event.target.value)}
            className="h-10 rounded-control border border-slate-300 bg-white px-2 text-sm"
          />
          <input
            type="date"
            aria-label={t("common.to")}
            value={filter.endDate}
            onChange={(event) => filter.setEndDate(event.target.value)}
            className="h-10 rounded-control border border-slate-300 bg-white px-2 text-sm"
          />
        </>
      )}
    </div>
  );
}
