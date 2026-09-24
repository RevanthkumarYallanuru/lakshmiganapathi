import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { exportBills, listBills } from "@/api/endpoints/billing";
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
import type { Bill } from "@/types";

function itemsSummary(bill: Bill): string {
  if (bill.bill_items.length === 0) return "—";
  const names = bill.bill_items.map((line) => line.item_name_snapshot);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

/** The customer-facing "transaction history" — one row per bill (not
 * per ledger entry), in plain business language, with each row
 * navigating straight to that bill's own historical detail page
 * (which renders from the bill's stored snapshots, never today's
 * prices). Sits alongside — not instead of — the accounting-style
 * CustomerLedgerPanel below it. */
export function CustomerBillsPanel({ customerId }: { customerId: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const dateFilter = useDateRangeFilter("all");
  const params = { customer_id: customerId, ...dateFilter.params };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.bills.list(params),
    queryFn: () => listBills(params),
    enabled: dateFilter.ready,
  });

  // The API already returns newest first.
  const bills = data?.data ?? [];

  const columns: TableColumn<Bill>[] = [
    {
      key: "date",
      header: t("customers.billDateTime"),
      render: (bill) => formatDate(bill.transaction_at, true),
    },
    {
      key: "billId",
      header: t("customers.billId"),
      render: (bill) => (
        <div>
          <p className="font-medium text-slate-800">{bill.bill_number}</p>
          {bill.status === "CANCELLED" && (
            <Badge tone="danger">{bill.status}</Badge>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: t("customers.billDescription"),
      render: (bill) => (
        <span className="text-slate-500">{itemsSummary(bill)}</span>
      ),
    },
    {
      key: "total",
      header: t("customers.totalBill"),
      render: (bill) => formatMoney(bill.grand_total),
    },
    {
      key: "paid",
      header: t("billing.paidNow"),
      render: (bill) => formatMoney(bill.amount_paid),
    },
    {
      key: "oldBalance",
      header: t("billing.previousBalance"),
      render: (bill) => formatMoney(bill.previous_balance),
    },
    {
      key: "totalBalance",
      header: t("customers.totalBalance"),
      render: (bill) => (
        <span className="font-medium text-slate-800">
          {formatMoney(bill.overall_balance)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={t("customers.bills")}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DateRangeFilter filter={dateFilter} />
            <ExportButton
              onExport={() =>
                exportBills({ customer_id: customerId, ...dateFilter.params })
              }
              disabled={!dateFilter.ready}
            />
          </div>
        }
      />
      <Table
        columns={columns}
        data={bills}
        keyExtractor={(bill) => bill.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        loadingLabel={t("common.loading")}
        emptyTitle={t("customers.noTransactions")}
        onRowClick={(bill) => navigate(`/billing/${bill.id}`)}
      />
    </Card>
  );
}
