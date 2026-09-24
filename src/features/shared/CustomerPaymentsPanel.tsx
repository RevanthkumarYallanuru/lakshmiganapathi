import { useQuery } from "@tanstack/react-query";

import { exportPayments, listPayments } from "@/api/endpoints/payments";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Card,
  CardHeader,
  DateRangeFilter,
  ExportButton,
  Table,
  useDateRangeFilter,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import type { Payment } from "@/types";

/** This customer's payments, newest first, with the same date filter
 * and Excel export as the main Payments page (same endpoint, just
 * pre-filtered to one customer). */
export function CustomerPaymentsPanel({ customerId }: { customerId: string }) {
  const { t } = useLanguage();
  const dateFilter = useDateRangeFilter("all");
  const params = { customer_id: customerId, ...dateFilter.params };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => listPayments(params),
    enabled: dateFilter.ready,
  });

  const payments = data?.data ?? [];

  const columns: TableColumn<Payment>[] = [
    {
      key: "number",
      header: t("payments.paymentNumber"),
      render: (payment) => (
        <span className="font-medium text-slate-800">{payment.payment_number}</span>
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
    <Card>
      <CardHeader
        title={t("payments.title")}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DateRangeFilter filter={dateFilter} />
            <ExportButton
              onExport={() => exportPayments(params)}
              disabled={!dateFilter.ready}
            />
          </div>
        }
      />
      <Table
        columns={columns}
        data={payments}
        keyExtractor={(payment) => payment.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        loadingLabel={t("common.loading")}
        emptyTitle={t("customers.noTransactions")}
      />
    </Card>
  );
}
