import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import {
  exportPaymentsReport,
  getPaymentsReport,
  type ReportRange,
} from "@/api/endpoints/reports";
import { queryKeys } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import {
  Badge,
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
import type { PaymentsReport } from "@/types";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function PaymentsReportPanel() {
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
    queryKey: queryKeys.reports.payments(params),
    queryFn: () => getPaymentsReport(params),
    enabled: range !== "custom" || (!!startDate && !!endDate),
  });

  async function handleExport() {
    setExporting(true);
    try {
      await exportPaymentsReport(params);
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

  const methodColumns: TableColumn<PaymentsReport["by_method"][number]>[] = [
    { key: "method", header: t("payments.method"), render: (row) => <Badge tone="neutral">{row.payment_method}</Badge> },
    { key: "count", header: t("reports.totalPayments"), render: (row) => String(row.count) },
    { key: "amount", header: t("reports.totalAmount"), render: (row) => formatMoney(row.total_amount) },
  ];

  const dailyColumns: TableColumn<PaymentsReport["daily"][number]>[] = [
    { key: "date", header: t("common.date"), render: (row) => formatDate(row.date) },
    { key: "count", header: t("reports.totalPayments"), render: (row) => String(row.total_payments) },
    { key: "amount", header: t("reports.totalAmount"), render: (row) => formatMoney(row.total_amount) },
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
            <StatTile label={t("reports.totalPayments")} value={String(data.summary.total_payments)} />
            <StatTile label={t("reports.totalAmount")} value={formatMoney(data.summary.total_amount)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={t("reports.byMethod")} />
              <Table
                columns={methodColumns}
                data={data.by_method}
                keyExtractor={(row) => row.payment_method}
                emptyTitle={t("reports.noData")}
              />
            </Card>
            <Card>
              <CardHeader title={t("reports.dailyBreakdown")} />
              <Table
                columns={dailyColumns}
                data={data.daily}
                keyExtractor={(row) => row.date}
                emptyTitle={t("reports.noData")}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
