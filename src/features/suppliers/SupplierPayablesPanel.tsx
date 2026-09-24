import { useQuery } from "@tanstack/react-query";

import { exportPayables, listPayables } from "@/api/endpoints/payables";
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
import type { TranslationKey } from "@/i18n";
import { formatDate, formatMoney } from "@/lib/money";
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

/** This supplier's My Pays — one row per payable, the same list shown
 * on the main My Pays page but pre-filtered to this supplier, so the
 * two screens never drift apart (same endpoint, same data). */
export function SupplierPayablesPanel({
  supplierId,
  onSelectPayable,
}: {
  supplierId: string;
  onSelectPayable: (payable: Payable) => void;
}) {
  const { t } = useLanguage();

  const dateFilter = useDateRangeFilter("all");
  const params = { supplier_id: supplierId, ...dateFilter.params };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.payables.list(params),
    queryFn: () => listPayables(params),
    enabled: dateFilter.ready,
  });

  const payables = data?.data ?? [];

  const columns: TableColumn<Payable>[] = [
    {
      key: "date",
      header: t("payables.payableDate"),
      render: (payable) => formatDate(payable.payable_date),
    },
    {
      key: "reason",
      header: t("payables.forWhat"),
      render: (payable) => (
        <span className="line-clamp-1 max-w-[220px] text-slate-600">
          {payable.reason}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("payables.amountToPay"),
      render: (payable) => formatMoney(payable.total_amount),
    },
    {
      key: "paid",
      header: t("payables.totalPaid"),
      render: (payable) => formatMoney(payable.amount_paid),
    },
    {
      key: "balance",
      header: t("payables.remaining"),
      render: (payable) => {
        const remaining = Math.max(
          0,
          Number(payable.total_amount) - Number(payable.amount_paid)
        );
        return (
          <span className="font-medium text-slate-800">
            {formatMoney(remaining)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("common.status"),
      render: (payable) => (
        <Badge tone={STATUS_TONE[payable.status]}>
          {t(STATUS_LABEL_KEY[payable.status])}
        </Badge>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={t("suppliers.pays")}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DateRangeFilter filter={dateFilter} />
            <ExportButton
              onExport={() => exportPayables(params)}
              disabled={!dateFilter.ready}
            />
          </div>
        }
      />
      <Table
        columns={columns}
        data={payables}
        keyExtractor={(payable) => payable.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        loadingLabel={t("common.loading")}
        emptyTitle={t("payables.noPayables")}
        onRowClick={onSelectPayable}
      />
    </Card>
  );
}
