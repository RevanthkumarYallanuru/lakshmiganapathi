import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import {
  exportCustomerLedger,
  getCustomerBalance,
  getCustomerLedger,
} from "@/api/endpoints/ledger";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DateRangeFilter,
  Select,
  Table,
  useDateRangeFilter,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import type { LedgerEntry, LedgerEntryType } from "@/types";

const entryTypeKey: Record<
  LedgerEntryType,
  `ledger.entryType.${LedgerEntryType}`
> = {
  SALE: "ledger.entryType.SALE",
  PAYMENT: "ledger.entryType.PAYMENT",
  RETURN: "ledger.entryType.RETURN",
  ADJUSTMENT: "ledger.entryType.ADJUSTMENT",
};

function mergeSameMomentSaleAndPayment(entries: LedgerEntry[]): LedgerEntry[] {
  // Pair each SALE with the PAYMENT written at the same instant first,
  // so the result doesn't depend on which of the two comes first in the
  // list (newest-first puts the later-id PAYMENT ahead of its SALE).
  const paymentForSale = new Map<string, LedgerEntry>();
  const pairedPaymentIds = new Set<string>();

  for (const entry of entries) {
    if (entry.entry_type !== "SALE") continue;

    const paidAtSale = entries.find(
      (candidate) =>
        candidate.entry_type === "PAYMENT" &&
        !pairedPaymentIds.has(candidate.id) &&
        candidate.transaction_at === entry.transaction_at
    );

    if (paidAtSale) {
      paymentForSale.set(entry.id, paidAtSale);
      pairedPaymentIds.add(paidAtSale.id);
    }
  }

  const result: LedgerEntry[] = [];

  for (const entry of entries) {
    if (pairedPaymentIds.has(entry.id)) continue;

    const paidAtSale = paymentForSale.get(entry.id);
    result.push(
      paidAtSale
        ? {
            ...entry,
            credit: paidAtSale.credit,
            balance_after: paidAtSale.balance_after,
          }
        : entry
    );
  }

  return result;
}

/** Outstanding + Total Sales/Payments stat cards, plus the full
 * transaction history table and XLSX export — the one implementation
 * shared by the Customer Profile page and the standalone Ledger page. */
export function CustomerLedgerPanel({ customerId }: { customerId: string }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [entryType, setEntryType] = useState<LedgerEntryType | "">("");
  const [exporting, setExporting] = useState(false);
  const dateFilter = useDateRangeFilter("all");

  const { data: balance } = useQuery({
    queryKey: queryKeys.ledger.balance(customerId),
    queryFn: () => getCustomerBalance(customerId),
  });

  // Stats always summarize the FULL history regardless of the type
  // filter below — a separate, unfiltered fetch, so switching the
  // filter to "Payment" doesn't make "Total Sales" look like zero.
  const allEntriesParams = { limit: 500 };
  const { data: allEntriesData } = useQuery({
    queryKey: queryKeys.ledger.entries(customerId, allEntriesParams),
    queryFn: () => getCustomerLedger(customerId, allEntriesParams),
  });
  const allEntries = allEntriesData?.data ?? [];

  const ledgerParams = {
    limit: 500,
    entry_type: entryType || undefined,
    ...dateFilter.params,
  };
  const {
    data: ledgerData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.ledger.entries(customerId, ledgerParams),
    queryFn: () => getCustomerLedger(customerId, ledgerParams),
    enabled: dateFilter.ready,
  });

  const rawEntries = ledgerData?.data ?? [];

  // A payment made at the moment of sale (not a later, separate
  // payment) gets its own SALE and PAYMENT ledger rows for correct
  // double-entry bookkeeping, but to the shop owner it was one
  // transaction — so when viewing "All types", fold the two back into
  // a single row (debit from the sale, credit from the payment). Both
  // rows share the exact same transaction_at because billing.service
  // writes them in the same DB transaction from the same Date value —
  // that's the reliable signal a real *later* payment won't have.
  // Filtering to one specific type shows the raw rows instead, since
  // a merged row wouldn't make sense under a single-type filter.
  const entries =
    entryType === "" ? mergeSameMomentSaleAndPayment(rawEntries) : rawEntries;

  // Display-only summaries derived from the server's own ledger
  // entries — the authoritative outstanding balance comes from the
  // /balance endpoint above, never from this client-side sum. A
  // reversal is a separate ADJUSTMENT entry (never mutates the
  // original SALE/PAYMENT row), so it must be netted out of the
  // matching bucket here, or "Total Sales - Total Payments" would
  // stop matching the real Outstanding figure after any reversal.
  const totalSales =
    allEntries
      .filter((entry) => entry.entry_type === "SALE")
      .reduce((sum, entry) => sum + Number(entry.debit), 0) -
    allEntries
      .filter((entry) => entry.entry_type === "ADJUSTMENT" && entry.bill_id)
      .reduce((sum, entry) => sum + Number(entry.credit), 0);
  const totalPayments =
    allEntries
      .filter((entry) => entry.entry_type === "PAYMENT")
      .reduce((sum, entry) => sum + Number(entry.credit), 0) -
    allEntries
      .filter(
        (entry) => entry.entry_type === "ADJUSTMENT" && entry.payment_id
      )
      .reduce((sum, entry) => sum + Number(entry.debit), 0);

  async function handleExport() {
    setExporting(true);
    try {
      await exportCustomerLedger(customerId, ledgerParams);
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setExporting(false);
    }
  }

  const columns: TableColumn<LedgerEntry>[] = [
    {
      key: "date",
      header: t("common.date"),
      render: (entry) => formatDate(entry.transaction_at, true),
    },
    {
      key: "type",
      header: t("ledger.type"),
      render: (entry) => (
        <Badge
          tone={
            entry.entry_type === "SALE"
              ? "danger"
              : entry.entry_type === "PAYMENT"
                ? "success"
                : "neutral"
          }
        >
          {t(entryTypeKey[entry.entry_type])}
        </Badge>
      ),
    },
    {
      key: "description",
      header: t("ledger.description"),
      render: (entry) => (
        <span className="text-slate-500">{entry.description ?? "—"}</span>
      ),
    },
    {
      key: "debit",
      header: t("ledger.debit"),
      render: (entry) =>
        Number(entry.debit) > 0 ? formatMoney(entry.debit) : "—",
    },
    {
      key: "credit",
      header: t("ledger.credit"),
      render: (entry) =>
        Number(entry.credit) > 0 ? formatMoney(entry.credit) : "—",
    },
    {
      key: "balance",
      header: t("common.balance"),
      render: (entry) => (
        <span className="font-medium text-slate-800">
          {formatMoney(entry.balance_after)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-slate-500">
            {t("customers.outstanding")}
          </p>
          <p className="mt-1 text-lg font-semibold text-danger-600">
            {balance ? formatMoney(balance.balance) : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">
            {t("customers.totalSales")}
          </p>
          <p className="mt-1 text-lg font-semibold text-success-700">
            {formatMoney(totalSales)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">
            {t("customers.totalPayments")}
          </p>
          <p className="mt-1 text-lg font-semibold text-accent-600">
            {formatMoney(totalPayments)}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t("customers.transactionHistory")}
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <DateRangeFilter filter={dateFilter} />
              <Select
                value={entryType}
                onValueChange={(value) =>
                  setEntryType(value as LedgerEntryType)
                }
                placeholder={t("ledger.allTypes")}
                options={[
                  { value: "SALE", label: t("ledger.entryType.SALE") },
                  { value: "PAYMENT", label: t("ledger.entryType.PAYMENT") },
                  { value: "RETURN", label: t("ledger.entryType.RETURN") },
                  {
                    value: "ADJUSTMENT",
                    label: t("ledger.entryType.ADJUSTMENT"),
                  },
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                loading={exporting}
                disabled={entries.length === 0 || !dateFilter.ready}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {t("common.export")}
              </Button>
            </div>
          }
        />
        <Table
          columns={columns}
          data={entries}
          keyExtractor={(entry) => entry.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("customers.noTransactions")}
        />
      </Card>
    </div>
  );
}
