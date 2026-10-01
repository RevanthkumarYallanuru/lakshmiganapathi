import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  exportStockTally,
  getStockTally,
  setItemStock,
} from "@/api/endpoints/inventory";
import { queryKeys } from "@/api/queryKeys";
import { Button, ExportButton, Table, useToast } from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import {
  AdjustStockDialog,
  type AdjustStockSubmitValues,
} from "@/features/inventory/AdjustStockDialog";
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
 * IMPORT/SALE/ADJUSTMENT/CORRECTION movement, not just the last
 * import. Imports itself stays purely a purchase-history page; this is
 * where "how much do we actually have" lives, and the per-row "Adjust
 * Stock" button is the one place to correct it by hand. */
export function InventoryPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [historyItem, setHistoryItem] = useState<StockTallyRow | null>(null);
  const [adjustItem, setAdjustItem] = useState<StockTallyRow | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.inventory.tally(),
    queryFn: () => getStockTally(),
  });

  const rows = data?.data ?? [];

  const adjustMutation = useMutation({
    mutationFn: (values: AdjustStockSubmitValues) =>
      setItemStock(adjustItem!.item_id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ variant: "success", title: t("inventory.adjustSuccess") });
      setAdjustItem(null);
      setAdjustError(null);
    },
    onError: (error) => {
      setAdjustError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

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
      // Never shown negative — see inventory.service.ts's getStockTally
      // doc comment: a handful of items have more historical sales
      // than recorded imports, which the backend floors at 0 here
      // rather than surfacing as a negative count.
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.remaining_stock}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setAdjustError(null);
              setAdjustItem(row);
            }}
            aria-label={t("inventory.adjustStock")}
            title={t("inventory.adjustStock")}
          >
            <PenLine className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("inventory.title")}
        </h1>
        <ExportButton onExport={() => exportStockTally()} />
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

      <AdjustStockDialog
        open={!!adjustItem}
        item={adjustItem}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustItem(null);
            setAdjustError(null);
          }
        }}
        onSubmit={(values) => adjustMutation.mutate(values)}
        isSubmitting={adjustMutation.isPending}
        formError={adjustError}
      />
    </div>
  );
}
