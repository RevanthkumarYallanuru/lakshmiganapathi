import { useQuery } from "@tanstack/react-query";

import { listSupplierPayments } from "@/api/endpoints/suppliers";
import { queryKeys } from "@/api/queryKeys";
import { Card, CardHeader, Table } from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import type { SupplierPayment } from "@/types";

/** This supplier's bulk-payment history — one row per "Make Payment"
 * submission (each internally allocated across one or more payables via
 * payable_payments.supplier_payment_id, see PayableDetailDialog for the
 * per-payable breakdown of any individual payment). */
export function SupplierPaymentsPanel({ supplierId }: { supplierId: string }) {
  const { t } = useLanguage();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.suppliers.payments(supplierId),
    queryFn: () => listSupplierPayments(supplierId),
  });

  const payments = data?.data ?? [];

  const columns: TableColumn<SupplierPayment>[] = [
    {
      key: "date",
      header: t("common.date"),
      render: (payment) => formatDate(payment.payment_date),
    },
    {
      key: "reason",
      header: t("payables.forWhat"),
      render: (payment) => (
        <span className="text-slate-600">{payment.reason}</span>
      ),
    },
    {
      key: "allocations",
      header: t("suppliers.appliedTo"),
      render: (payment) => (
        <span className="text-slate-500">
          {payment.payable_payments?.length ?? 0}{" "}
          {t("suppliers.payables")}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("payables.paymentAmount"),
      render: (payment) => (
        <span className="font-medium text-success-700">
          {formatMoney(payment.amount)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader title={t("suppliers.paymentHistory")} />
      <Table
        columns={columns}
        data={payments}
        keyExtractor={(payment) => payment.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        loadingLabel={t("common.loading")}
        emptyTitle={t("suppliers.noPayments")}
      />
    </Card>
  );
}
