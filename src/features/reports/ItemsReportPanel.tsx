import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import {
  exportItemSalesReport,
  getItemSalesReport,
  type ReportRange,
} from "@/api/endpoints/reports";
import { queryKeys } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import {
  Button,
  ErrorState,
  LoadingState,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { ReportRangePicker } from "@/features/reports/ReportRangePicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney } from "@/lib/money";
import type { ItemSalesReport } from "@/types";

export function ItemsReportPanel() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [range, setRange] = useState<ReportRange>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const params =
    range === "custom"
      ? { range, start_date: startDate || undefined, end_date: endDate || undefined }
      : { range };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.reports.items(params),
    queryFn: () => getItemSalesReport(params),
    enabled: range !== "custom" || (!!startDate && !!endDate),
  });

  async function handleExport() {
    setExporting(true);
    try {
      await exportItemSalesReport(params);
      toast({ variant: "success", title: t("reports.exportSuccess") });
    } catch (error) {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("reports.exportError"),
      });
    } finally {
      setExporting(false);
    }
  }

  const columns: TableColumn<ItemSalesReport["items"][number]>[] = [
    { key: "item", header: t("reports.itemName"), render: (row) => row.item_name },
    { key: "unit", header: t("reports.unit"), render: (row) => row.unit },
    { key: "bills", header: t("reports.billCount"), render: (row) => String(row.bill_count) },
    { key: "quantity", header: t("reports.totalQuantity"), render: (row) => row.total_quantity },
    { key: "sales", header: t("reports.totalSales"), render: (row) => formatMoney(row.total_sales) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportRangePicker
          range={range}
          onRangeChange={setRange}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <Button variant="outline" onClick={handleExport} loading={exporting}>
          <Download className="h-4 w-4" aria-hidden />
          {t("reports.exportExcel")}
        </Button>
      </div>

      {isLoading || !data ? (
        <LoadingState label={t("common.loading")} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retryLabel={t("common.retry")} />
      ) : (
        <div className="rounded-card border border-slate-200 bg-white p-2">
          <Table
            columns={columns}
            data={data.items}
            keyExtractor={(row) => row.item_id}
            emptyTitle={t("reports.noData")}
          />
        </div>
      )}
    </div>
  );
}
