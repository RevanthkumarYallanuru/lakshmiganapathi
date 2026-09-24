import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  createImport,
  listImports,
  type CreateImportInput,
} from "@/api/endpoints/imports";
import { queryKeys } from "@/api/queryKeys";
import { Badge, Button, Pagination, Table, useToast } from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { ImportFormDialog } from "@/features/imports/ImportFormDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { usePagination } from "@/hooks/usePagination";
import { formatDate, formatMoney } from "@/lib/money";
import type { Import } from "@/types";

function ImportItemCell({ importRecord }: { importRecord: Import }) {
  const name = useLocalizedName(
    importRecord.items?.english_name ?? "",
    importRecord.items?.telugu_name ?? null
  );
  return <span className="text-slate-700">{name || "—"}</span>;
}

export function ImportsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.imports.list({}),
    queryFn: () => listImports(),
  });

  const imports = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(imports);

  const createMutation = useMutation({
    mutationFn: (values: CreateImportInput) => createImport(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.imports.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payables.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.balances() });
      toast({ variant: "success", title: t("imports.createSuccess") });
      setCreateOpen(false);
      setCreateError(null);
    },
    onError: (error) => {
      setCreateError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const columns: TableColumn<Import>[] = [
    {
      key: "date",
      header: t("common.date"),
      render: (importRecord) => formatDate(importRecord.import_date),
    },
    {
      key: "supplier",
      header: t("suppliers.title"),
      render: (importRecord) => (
        <span className="font-medium text-slate-800">
          {importRecord.suppliers?.name}
        </span>
      ),
    },
    {
      key: "item",
      header: t("imports.item"),
      render: (importRecord) => <ImportItemCell importRecord={importRecord} />,
    },
    {
      key: "quantity",
      header: t("imports.quantity"),
      render: (importRecord) => `${importRecord.quantity} ${importRecord.unit}`,
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
      key: "pending",
      header: t("imports.pending"),
      render: (importRecord) => {
        const pending =
          Number(importRecord.amount) - Number(importRecord.paid_amount);
        if (pending <= 0) {
          return <Badge tone="success">{t("imports.settled")}</Badge>;
        }
        return (
          <span className="font-medium text-danger-600">
            {formatMoney(pending)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("imports.title")}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("imports.new")}
        </Button>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(importRecord) => importRecord.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("imports.noImports")}
          onRowClick={(importRecord) =>
            navigate(`/suppliers/${importRecord.supplier_id}`)
          }
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ImportFormDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
        formError={createError}
      />
    </div>
  );
}
