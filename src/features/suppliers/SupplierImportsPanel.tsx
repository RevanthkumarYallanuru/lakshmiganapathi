import { useQuery } from "@tanstack/react-query";

import { exportImports, listImports } from "@/api/endpoints/imports";
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
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { formatDate, formatMoney } from "@/lib/money";
import type { Import } from "@/types";

function ImportItemCell({ importRecord }: { importRecord: Import }) {
  const name = useLocalizedName(
    importRecord.items?.english_name ?? "",
    importRecord.items?.telugu_name ?? null
  );
  return <span className="text-slate-700">{name || "—"}</span>;
}

/** Import-related purchases linked to this supplier — satisfies
 * "Import-related payments linked to this supplier" on the profile.
 * The linked My Pay (if any) already shows separately in
 * SupplierPayablesPanel via the same payables endpoint. */
export function SupplierImportsPanel({ supplierId }: { supplierId: string }) {
  const { t } = useLanguage();

  const dateFilter = useDateRangeFilter("all");
  const params = { supplier_id: supplierId, ...dateFilter.params };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.imports.list(params),
    queryFn: () => listImports(params),
    enabled: dateFilter.ready,
  });

  const imports = data?.data ?? [];

  const columns: TableColumn<Import>[] = [
    {
      key: "date",
      header: t("common.date"),
      render: (importRecord) => formatDate(importRecord.import_date),
    },
    {
      key: "item",
      header: t("imports.item"),
      render: (importRecord) => <ImportItemCell importRecord={importRecord} />,
    },
    {
      key: "quantity",
      header: t("imports.quantity"),
      render: (importRecord) =>
        `${importRecord.quantity} ${importRecord.unit}`,
    },
    {
      key: "amount",
      header: t("imports.amount"),
      render: (importRecord) => formatMoney(importRecord.amount),
    },
    {
      key: "paid",
      header: t("imports.paidAmount"),
      render: (importRecord) => formatMoney(importRecord.paid_amount),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (importRecord) => {
        const pending =
          Number(importRecord.amount) - Number(importRecord.paid_amount);
        if (pending <= 0) {
          return <Badge tone="success">{t("imports.settled")}</Badge>;
        }
        return (
          <Badge tone={importRecord.payables?.status === "PAID" ? "success" : "warning"}>
            {importRecord.payables
              ? t(
                  importRecord.payables.status === "PAID"
                    ? "payables.statusPaid"
                    : importRecord.payables.status === "PARTIALLY_PAID"
                      ? "payables.statusPartiallyPaid"
                      : "payables.statusPending"
                )
              : t("payables.statusPending")}
          </Badge>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader
        title={t("imports.title")}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DateRangeFilter filter={dateFilter} />
            <ExportButton
              onExport={() => exportImports(params)}
              disabled={!dateFilter.ready}
            />
          </div>
        }
      />
      <Table
        columns={columns}
        data={imports}
        keyExtractor={(importRecord) => importRecord.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        loadingLabel={t("common.loading")}
        emptyTitle={t("imports.noImports")}
      />
    </Card>
  );
}
