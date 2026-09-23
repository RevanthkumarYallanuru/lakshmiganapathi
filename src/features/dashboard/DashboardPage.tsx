import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Receipt, TrendingUp, Users } from "lucide-react";

import { getDashboard, type ReportRange } from "@/api/endpoints/reports";
import { queryKeys } from "@/api/queryKeys";
import { Badge, Card, CardHeader, ErrorState, LoadingState, Select } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";
import { formatDate, formatMoney } from "@/lib/money";
import type { Bill, Payment } from "@/types";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: { value: ReportRange; labelKey: TranslationKey }[] = [
  { value: "today", labelKey: "common.today" },
  { value: "week", labelKey: "common.thisWeek" },
  { value: "month", labelKey: "common.thisMonth" },
  { value: "year", labelKey: "dashboard.thisYear" },
  { value: "all", labelKey: "common.allTime" },
  { value: "custom", labelKey: "common.customRange" },
];

const TONE_CLASSES = {
  accent: "bg-accent-50 text-accent-600",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-600",
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "accent",
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <Card className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-control",
          TONE_CLASSES[tone]
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState<ReportRange>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params =
    range === "custom"
      ? { range, start_date: startDate || undefined, end_date: endDate || undefined }
      : { range };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: () => getDashboard(params),
    enabled: range !== "custom" || (!!startDate && !!endDate),
  });

  const periodLabel =
    range === "today"
      ? t("dashboard.todaySales")
      : t("dashboard.sales");
  const paidLabel =
    range === "today" ? t("dashboard.todayPayments") : t("dashboard.payments");
  const billsLabel =
    range === "today" ? t("dashboard.billsToday") : t("dashboard.bills");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("dashboard.title")}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={range}
            onValueChange={(value) => setRange(value as ReportRange)}
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
        </div>
      </div>

      {isLoading || !data ? (
        <LoadingState label={t("dashboard.loading")} />
      ) : isError ? (
        <ErrorState
          title={t("dashboard.error")}
          description=""
          onRetry={() => refetch()}
          retryLabel={t("common.retry")}
        />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label={periodLabel}
          value={formatMoney(data.today.sales_total)}
          tone="success"
        />
        <StatCard
          icon={CheckCircle2}
          label={paidLabel}
          value={formatMoney(data.today.payments_total)}
          tone="accent"
        />
        <StatCard
          icon={Receipt}
          label={t("dashboard.outstanding")}
          value={formatMoney(data.outstanding_total)}
          tone="danger"
        />
        <StatCard
          icon={Users}
          label={billsLabel}
          value={String(data.today.bills_count)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("dashboard.recentBills")} />
          {data.recent_bills.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              {t("common.noResults")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent_bills.map((bill: Bill) => (
                <li
                  key={bill.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {bill.bill_number}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(bill.transaction_at, true)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">
                      {formatMoney(bill.grand_total)}
                    </span>
                    <Badge
                      tone={
                        bill.status === "CANCELLED"
                          ? "danger"
                          : bill.status === "COMPLETED"
                            ? "success"
                            : "neutral"
                      }
                    >
                      {bill.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t("dashboard.recentPayments")} />
          {data.recent_payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              {t("common.noResults")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent_payments.map((payment: Payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {payment.payment_number}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(payment.payment_at, true)}
                    </p>
                  </div>
                  <span className="font-medium text-slate-700">
                    {formatMoney(payment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:w-1/2">
        <StatCard
          icon={Users}
          label={t("dashboard.customers")}
          value={String(data.customers_count)}
        />
        <StatCard
          icon={Receipt}
          label={t("dashboard.items")}
          value={String(data.items_count)}
        />
      </div>
        </>
      )}
    </div>
  );
}
