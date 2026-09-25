import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, HandCoins, IndianRupee, Plus, Wallet } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  createPayable,
  exportPayables,
  getPayablesInsights,
  listPayables,
  recordPayablePayment,
  type ListPayablesParams,
} from "@/api/endpoints/payables";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  Card,
  DateRangeFilter,
  ExportButton,
  Pagination,
  SearchInput,
  Select,
  Table,
  useDateRangeFilter,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { PayableFormDialog } from "@/features/payables/PayableFormDialog";
import { PayableDetailDialog } from "@/features/payables/PayableDetailDialog";
import {
  PayablePaymentDialog,
  type PayablePaymentSubmitValues,
} from "@/features/payables/PayablePaymentDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";
import { formatDate, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Payable, PayableStatus } from "@/types";

const STATUS_TONE: Record<PayableStatus, "neutral" | "warning" | "success"> = {
  PENDING: "neutral",
  PARTIALLY_PAID: "warning",
  PAID: "success",
};

const STATUS_LABEL_KEY: Record<PayableStatus, TranslationKey> = {
  PENDING: "payables.statusPending",
  PARTIALLY_PAID: "payables.statusPartiallyPaid",
  PAID: "payables.statusPaid",
};

const INSIGHTS_TONE_CLASSES = {
  accent: "bg-accent-50 text-accent-600",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-600",
} as const;

function InsightCard({
  icon: Icon,
  label,
  value,
  tone = "accent",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: keyof typeof INSIGHTS_TONE_CLASSES;
}) {
  return (
    <Card className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-control",
          INSIGHTS_TONE_CLASSES[tone]
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

export function PayablesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<PayableStatus | "">("");
  const dateFilter = useDateRangeFilter("all");

  // Cards default to All time, same as the list, so a fresh page never
  // shows zeros while the table below is full of payables.
  const insightsFilter = useDateRangeFilter("all");
  const insightsParams = {
    range: insightsFilter.range,
    ...(insightsFilter.range === "custom" && {
      start_date: insightsFilter.startDate,
      end_date: insightsFilter.endDate,
    }),
  };

  const { data: insights } = useQuery({
    queryKey: queryKeys.payables.insights(insightsParams),
    queryFn: () => getPayablesInsights(insightsParams),
    enabled: insightsFilter.ready,
    placeholderData: keepPreviousData,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [detailPayable, setDetailPayable] = useState<Payable | null>(null);
  const [paymentPayable, setPaymentPayable] = useState<Payable | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const params: ListPayablesParams = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    ...dateFilter.params,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.payables.list(params),
    queryFn: () => listPayables(params),
    placeholderData: keepPreviousData,
    enabled: dateFilter.ready,
  });

  const payables = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(payables);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.payables.all() });
  }

  const createMutation = useMutation({
    mutationFn: createPayable,
    onSuccess: () => {
      invalidate();
      toast({ variant: "success", title: t("payables.createSuccess") });
      setCreateOpen(false);
      setCreateError(null);
    },
    onError: (error) => {
      setCreateError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (values: PayablePaymentSubmitValues) =>
      recordPayablePayment(paymentPayable!.id, values),
    onSuccess: (updated) => {
      invalidate();
      toast({ variant: "success", title: t("payables.paymentSuccess") });
      setPaymentPayable(null);
      setPaymentError(null);
      // Keep the detail dialog in sync if it's open on the same record.
      setDetailPayable((prev) => (prev && prev.id === updated.id ? updated : prev));
    },
    onError: (error) => {
      setPaymentError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const columns: TableColumn<{ payable: Payable; slNo: number }>[] = [
    {
      key: "slNo",
      header: "Sl.No.",
      render: ({ slNo }) => slNo,
    },
    {
      key: "toWhom",
      header: t("payables.toWhom"),
      render: ({ payable }) => (
        <span className="font-medium text-slate-800">
          {payable.suppliers?.name}
        </span>
      ),
    },
    {
      key: "payableDate",
      header: t("payables.payableDate"),
      render: ({ payable }) => formatDate(payable.payable_date),
    },
    {
      key: "amount",
      header: t("payables.amountToPay"),
      render: ({ payable }) => formatMoney(payable.total_amount),
    },
    {
      key: "reason",
      header: t("payables.forWhat"),
      render: ({ payable }) => (
        <span className="line-clamp-1 max-w-[220px] text-slate-600">
          {payable.reason}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      render: ({ payable }) => {
        const remaining = Math.max(
          0,
          Number(payable.total_amount) - Number(payable.amount_paid)
        );
        return (
          <div className="flex flex-col gap-0.5">
            <Badge tone={STATUS_TONE[payable.status]}>
              {t(STATUS_LABEL_KEY[payable.status])}
            </Badge>
            {payable.status === "PARTIALLY_PAID" && (
              <span className="text-xs text-slate-500">
                {formatMoney(payable.amount_paid)} / {formatMoney(payable.total_amount)}{" "}
                {t("payables.paidSuffix")}
              </span>
            )}
            {payable.status === "PENDING" && (
              <span className="text-xs text-danger-600">
                {formatMoney(remaining)} {t("payables.remaining")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "paidDate",
      header: t("payables.paidDate"),
      render: ({ payable }) =>
        payable.paid_at ? formatDate(payable.paid_at) : "—",
    },
    {
      key: "actions",
      header: "",
      render: ({ payable }) => (
        <div className="flex items-center justify-end gap-1">
          {payable.status !== "PAID" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setPaymentError(null);
                setPaymentPayable(payable);
              }}
              aria-label={t("payables.makePayment")}
              title={t("payables.makePayment")}
            >
              <IndianRupee className="h-4 w-4" aria-hidden />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setDetailPayable(payable);
            }}
            aria-label={t("payables.viewDetails")}
            title={t("payables.viewDetails")}
          >
            <Eye className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  const rows = pageItems.map((payable, index) => ({
    payable,
    slNo: (page - 1) * 20 + index + 1,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">{t("payables.title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("payables.newPayment")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700">
            {t("payables.insights")}
          </h2>
          <DateRangeFilter filter={insightsFilter} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InsightCard
            icon={IndianRupee}
            label={t("payables.totalPaid")}
            value={formatMoney(insights?.total_paid ?? "0")}
            tone="success"
          />
          <InsightCard
            icon={Wallet}
            label={t("payables.balanceToPay")}
            value={formatMoney(insights?.total_remaining ?? "0")}
            tone="danger"
          />
          <InsightCard
            icon={HandCoins}
            label={t("payables.totalPays")}
            value={String(insights?.count ?? 0)}
            tone="accent"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("payables.searchPlaceholder")}
          className="max-w-sm flex-1"
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as PayableStatus)}
          placeholder={t("payables.allStatuses")}
          options={[
            { value: "PENDING", label: t("payables.statusPending") },
            { value: "PARTIALLY_PAID", label: t("payables.statusPartiallyPaid") },
            { value: "PAID", label: t("payables.statusPaid") },
          ]}
        />
        <DateRangeFilter filter={dateFilter} />
        <ExportButton
          onExport={() => exportPayables(params)}
          disabled={!dateFilter.ready}
        />
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.payable.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("payables.noPayables")}
          emptyDescription={t("payables.noPayablesHint")}
          onRowClick={(row) => setDetailPayable(row.payable)}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <PayableFormDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
        formError={createError}
      />

      <PayablePaymentDialog
        open={!!paymentPayable}
        payable={paymentPayable}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentPayable(null);
            setPaymentError(null);
          }
        }}
        onSubmit={(values) => paymentMutation.mutate(values)}
        isSubmitting={paymentMutation.isPending}
        formError={paymentError}
      />

      <PayableDetailDialog
        open={!!detailPayable}
        payable={detailPayable}
        onOpenChange={(open) => {
          if (!open) setDetailPayable(null);
        }}
        onMakePayment={() => {
          if (!detailPayable) return;
          // Close the detail dialog before opening the payment one —
          // two Radix dialogs open at once would stack awkwardly.
          const target = detailPayable;
          setDetailPayable(null);
          setPaymentError(null);
          setPaymentPayable(target);
        }}
      />
    </div>
  );
}
