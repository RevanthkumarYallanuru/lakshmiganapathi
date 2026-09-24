import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  createPayment,
  exportPayments,
  listPayments,
  type CreatePaymentInput,
  type ListPaymentsParams,
} from "@/api/endpoints/payments";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
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
import {
  PaymentFormDialog,
  type PaymentSubmitValues,
} from "@/features/payments/PaymentFormDialog";
import { PaymentDetailDialog } from "@/features/payments/PaymentDetailDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import type { Payment, PaymentMethod } from "@/types";

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function PaymentsListPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const dateFilter = useDateRangeFilter("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const params: ListPaymentsParams = {
    search: debouncedSearch || undefined,
    payment_method: method || undefined,
    ...dateFilter.params,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => listPayments(params),
    placeholderData: keepPreviousData,
    enabled: dateFilter.ready,
  });

  const payments = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(payments);

  const createMutation = useMutation({
    mutationFn: (values: PaymentSubmitValues) =>
      createPayment(values as CreatePaymentInput),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.ledger.balance(payment.customer_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.all() });
      toast({ variant: "success", title: t("payments.createSuccess") });
      setFormOpen(false);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const columns: TableColumn<Payment>[] = [
    {
      key: "number",
      header: t("payments.paymentNumber"),
      render: (payment) => (
        <div>
          <p className="font-medium text-slate-800">
            {payment.payment_number}
          </p>
          <p className="text-xs text-slate-400">
            {payment.customers?.english_name}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: t("common.date"),
      render: (payment) => formatDate(payment.payment_at, true),
    },
    {
      key: "amount",
      header: t("payments.amount"),
      render: (payment) => formatMoney(payment.amount),
    },
    {
      key: "method",
      header: t("payments.method"),
      render: (payment) => <Badge tone="neutral">{payment.payment_method}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("payments.title")}
        </h1>
        <Button
          onClick={() => {
            setFormError(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("payments.new")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("payments.searchPlaceholder")}
          className="max-w-sm flex-1"
        />
        <Select
          value={method}
          onValueChange={(value) => setMethod(value as PaymentMethod)}
          placeholder={t("billing.allTypes")}
          options={METHOD_OPTIONS}
        />
        <DateRangeFilter filter={dateFilter} />
        <ExportButton
          onExport={() => exportPayments(params)}
          disabled={!dateFilter.ready}
        />
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(payment) => payment.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("payments.noPayments")}
          emptyDescription={t("payments.noPaymentsHint")}
          onRowClick={(payment) => setDetailId(payment.id)}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <PaymentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
        formError={formError}
      />

      <PaymentDetailDialog
        paymentId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  );
}
