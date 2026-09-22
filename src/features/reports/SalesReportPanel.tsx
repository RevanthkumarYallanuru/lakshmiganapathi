import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import {
  exportSalesReport,
  getSalesReport,
  type ReportRange,
} from "@/api/endpoints/reports";
import { queryKeys } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import {
  Button,
  Card,
  CardHeader,
  ErrorState,
  LoadingState,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { ReportRangePicker } from "@/features/reports/ReportRangePicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import type { SalesReport } from "@/types";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function SalesReportPanel() {
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
    queryKey: queryKeys.reports.sales(params),
    queryFn: () => getSalesReport(params),
    enabled: range !== "custom" || (!!startDate && !!endDate),
  });

  async function handleExport() {
    setExporting(true);
    try {
      await exportSalesReport(params);
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

  const dailyColumns: TableColumn<SalesReport["daily"][number]>[] = [
    { key: "date", header: t("common.date"), render: (row) => formatDate(row.date) },
    { key: "bills", header: t("reports.totalBills"), render: (row) => String(row.total_bills) },
    { key: "sales", header: t("reports.totalSales"), render: (row) => formatMoney(row.total_sales) },
    { key: "paid", header: t("reports.totalPaid"), render: (row) => formatMoney(row.total_paid) },
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
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile label={t("reports.totalBills")} value={String(data.summary.total_bills)} />
            <StatTile label={t("reports.totalSubtotal")} value={formatMoney(data.summary.total_subtotal)} />
            <StatTile label={t("reports.totalDiscount")} value={formatMoney(data.summary.total_discount)} />
            <StatTile label={t("reports.totalSales")} value={formatMoney(data.summary.total_sales)} />
            <StatTile label={t("reports.totalPaid")} value={formatMoney(data.summary.total_paid)} />
          </div>

          <Card>
            <CardHeader title={t("reports.dailyBreakdown")} />
            <Table
              columns={dailyColumns}
              data={data.daily}
              keyExtractor={(row) => row.date}
              emptyTitle={t("reports.noData")}
            />
          </Card>
        </>
      )}
    </div>
  );
}
