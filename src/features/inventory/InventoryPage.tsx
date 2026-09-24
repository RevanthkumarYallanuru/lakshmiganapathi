import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getStockTally } from "@/api/endpoints/inventory";
import { queryKeys } from "@/api/queryKeys";
import { Table } from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { StockMovementHistoryDialog } from "@/features/inventory/StockMovementHistoryDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { formatDate } from "@/lib/money";
import type { StockTallyRow } from "@/types";

function ItemNameCell({ row }: { row: StockTallyRow }) {
  const name = useLocalizedName(row.english_name, row.telugu_name);
  return <span className="font-medium text-slate-800">{name}</span>;
}

/** Stock Tally — the reliable current-stock view, computed from every
 * IMPORT/SALE/ADJUSTMENT movement, not just the last import. Imports
 * itself stays purely a purchase-history page; this is where "how much
 * do we actually have" lives. */
export function InventoryPage() {
  const { t } = useLanguage();
  const [historyItem, setHistoryItem] = useState<StockTallyRow | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.inventory.tally(),
    queryFn: () => getStockTally(),
  });

  const rows = data?.data ?? [];

  const columns: TableColumn<StockTallyRow>[] = [
    {
      key: "item",
      header: t("inventory.item"),
      render: (row) => <ItemNameCell row={row} />,
    },
    {
      key: "lastImportDate",
      header: t("inventory.lastImportDate"),
      render: (row) =>
        row.last_import_date ? formatDate(row.last_import_date) : "—",
    },
    {
      key: "lastImportQty",
      header: t("inventory.lastImportQty"),
      render: (row) => row.last_import_qty ?? "—",
    },
    {
      key: "totalImported",
      header: t("inventory.totalImported"),
      render: (row) => row.total_imported,
    },
    {
      key: "totalSold",
      header: t("inventory.totalSold"),
      render: (row) => row.total_sold,
    },
    {
      key: "remaining",
      header: t("inventory.remainingStock"),
      render: (row) => (
        <span
          className={
            Number(row.remaining_stock) < 0
              ? "font-semibold text-danger-600"
              : "font-semibold text-slate-800"
          }
        >
          {row.remaining_stock}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("inventory.title")}
        </h1>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.item_id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("inventory.noItems")}
          onRowClick={(row) => setHistoryItem(row)}
        />
      </div>

      <StockMovementHistoryDialog
        open={!!historyItem}
        onOpenChange={(open) => {
          if (!open) setHistoryItem(null);
        }}
        itemId={historyItem?.item_id ?? null}
        itemName={historyItem?.english_name ?? ""}
      />
    </div>
  );
}
