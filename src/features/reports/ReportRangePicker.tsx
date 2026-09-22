import type { ReportRange } from "@/api/endpoints/reports";
import { Select } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";

const RANGE_OPTIONS: { value: ReportRange; labelKey: TranslationKey }[] = [
  { value: "today", labelKey: "common.today" },
  { value: "week", labelKey: "common.thisWeek" },
  { value: "month", labelKey: "common.thisMonth" },
  { value: "year", labelKey: "dashboard.thisYear" },
  { value: "custom", labelKey: "common.customRange" },
];

export function ReportRangePicker({
  range,
  onRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={range}
        onValueChange={(value) => onRangeChange(value as ReportRange)}
        options={RANGE_OPTIONS.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
      />
      {range === "custom" && (
        <>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="h-10 rounded-control border border-slate-300 bg-white px-2 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-10 rounded-control border border-slate-300 bg-white px-2 text-sm"
          />
        </>
      )}
    </div>
  );
}
