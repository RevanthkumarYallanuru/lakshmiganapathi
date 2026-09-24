import { useQuery } from "@tanstack/react-query";

import { getItemStockMovements } from "@/api/endpoints/inventory";
import { queryKeys } from "@/api/queryKeys";
import { Badge, Dialog, Table } from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";
import { formatDate } from "@/lib/money";
import type { StockMovement, StockMovementType } from "@/types";

const TYPE_TONE: Record<StockMovementType, "success" | "danger" | "neutral"> = {
  IMPORT: "success",
  SALE: "danger",
  ADJUSTMENT: "neutral",
};

const TYPE_LABEL_KEY: Record<StockMovementType, TranslationKey> = {
  IMPORT: "inventory.movementImport",
  SALE: "inventory.movementSale",
  ADJUSTMENT: "inventory.movementAdjustment",
};

export function StockMovementHistoryDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  itemName: string;
}) {
  const { t } = useLanguage();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.inventory.movements(itemId ?? ""),
    queryFn: () => getItemStockMovements(itemId!),
    enabled: !!itemId && open,
  });

  const movements = data?.data ?? [];

  const columns: TableColumn<StockMovement>[] = [
    {
      key: "date",
      header: t("common.date"),
      render: (movement) => formatDate(movement.transaction_at, true),
    },
    {
      key: "type",
      header: t("inventory.movementType"),
      render: (movement) => (
        <Badge tone={TYPE_TONE[movement.movement_type]}>
          {t(TYPE_LABEL_KEY[movement.movement_type])}
        </Badge>
      ),
    },
    {
      key: "description",
      header: t("inventory.reference"),
      render: (movement) => (
        <span className="text-slate-500">
          {movement.bills?.bill_number ?? movement.description ?? "—"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: t("inventory.quantity"),
      render: (movement) => {
        const inQty = Number(movement.quantity_in);
        const outQty = Number(movement.quantity_out);
        if (inQty > 0) {
          return <span className="font-medium text-success-700">+{inQty}</span>;
        }
        if (outQty > 0) {
          return <span className="font-medium text-danger-600">-{outQty}</span>;
        }
        return "—";
      },
    },
    {
      key: "balance",
      header: t("inventory.balance"),
      render: (movement) => (
        <span className="font-medium text-slate-800">
          {movement.balance_after}
        </span>
      ),
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("inventory.movementHistory")} — ${itemName}`}
      size="lg"
    >
      <Table
        columns={columns}
        data={movements}
        keyExtractor={(movement) => movement.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        loadingLabel={t("common.loading")}
        emptyTitle={t("inventory.noMovements")}
      />
    </Dialog>
  );
}
