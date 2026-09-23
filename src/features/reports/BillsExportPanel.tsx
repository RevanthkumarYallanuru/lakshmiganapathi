import { useState } from "react";
import { Download } from "lucide-react";

import { ApiError } from "@/api/client";
import { exportBillsReport, type ReportRange } from "@/api/endpoints/reports";
import { Alert, Button, Card, Select, useToast } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";

// Only the ranges this export was asked to support — a narrower list
// than the full Reports range picker (no "year").
const BILLS_RANGE_OPTIONS: { value: ReportRange; labelKey: TranslationKey }[] = [
  { value: "today", labelKey: "common.today" },
  { value: "week", labelKey: "common.thisWeek" },
  { value: "month", labelKey: "common.thisMonth" },
  { value: "custom", labelKey: "common.customRange" },
];

export function BillsExportPanel() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [range, setRange] = useState<ReportRange>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canExport =
    range !== "custom" || (!!startDate && !!endDate);

  async function handleExport() {
    if (!canExport) return;

    setExporting(true);
    setError(null);
    try {
      const params =
        range === "custom"
          ? { range, start_date: startDate, end_date: endDate }
          : { range };
      await exportBillsReport(params);
      toast({ variant: "success", title: t("reports.exportSuccess") });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("reports.exportError");
      setError(message);
      toast({ variant: "error", title: message });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">
          {t("reports.billsExportTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("reports.billsExportDescription")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={range}
          onValueChange={(value) => setRange(value as ReportRange)}
          options={BILLS_RANGE_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
        {range === "custom" && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 rounded-control border border-slate-300 bg-white px-2 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-10 rounded-control border border-slate-300 bg-white px-2 text-sm"
            />
          </>
        )}
        <Button onClick={handleExport} loading={exporting} disabled={!canExport}>
          <Download className="h-4 w-4" aria-hidden />
          {t("reports.exportExcel")}
        </Button>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}
    </Card>
  );
}
