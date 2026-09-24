import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createSupplier,
  getSupplierBalances,
  listSuppliers,
  setSupplierActive,
  updateSupplier,
} from "@/api/endpoints/suppliers";
import { queryKeys } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import {
  Badge,
  Button,
  ConfirmDialog,
  Pagination,
  SearchInput,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import {
  SupplierFormDialog,
  type SupplierFormValues,
} from "@/features/suppliers/SupplierFormDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney } from "@/lib/money";
import type { Supplier } from "@/types";

function SupplierNameCell({ supplier }: { supplier: Supplier }) {
  const name = useLocalizedName(supplier.name, supplier.telugu_name);
  return (
    <div>
      <p className="font-medium text-slate-800">{name}</p>
      {supplier.organization && (
        <p className="text-xs text-slate-400">{supplier.organization}</p>
      )}
    </div>
  );
}

export function SuppliersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    supplier: Supplier;
    nextActive: boolean;
  } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.suppliers.list(debouncedSearch),
    queryFn: () => listSuppliers(debouncedSearch || undefined),
    placeholderData: keepPreviousData,
  });

  // Balance for every supplier comes from one bulk call — avoids an
  // N+1 fetch per row, same pattern as the Customers list's outstanding
  // column.
  const { data: balancesData } = useQuery({
    queryKey: queryKeys.suppliers.balances(),
    queryFn: () => getSupplierBalances(),
    placeholderData: keepPreviousData,
  });
  const balanceBySupplier = new Map(
    (balancesData?.data ?? []).map((row) => [row.supplier_id, row])
  );

  const suppliers = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(suppliers);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
  }

  const createMutation = useMutation({
    mutationFn: (values: SupplierFormValues) =>
      createSupplier({
        name: values.name,
        telugu_name: values.telugu_name || undefined,
        phone: values.phone || undefined,
        alternate_phone: values.alternate_phone || undefined,
        organization: values.organization || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
        initial_balance: values.initial_balance
          ? Number(values.initial_balance)
          : undefined,
      }),
    onSuccess: async () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.payables.all() });
      toast({ variant: "success", title: t("suppliers.createSuccess") });
      setFormOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) =>
      updateSupplier(id, {
        name: values.name,
        telugu_name: values.telugu_name || undefined,
        phone: values.phone || undefined,
        alternate_phone: values.alternate_phone || undefined,
        organization: values.organization || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: async () => {
      invalidate();
      toast({ variant: "success", title: t("suppliers.updateSuccess") });
      setFormOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setSupplierActive(id, active),
    onSuccess: async () => {
      invalidate();
      setStatusTarget(null);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier, event?: React.MouseEvent) {
    event?.stopPropagation();
    setEditing(supplier);
    setFormOpen(true);
  }

  function handleSubmit(values: SupplierFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns: TableColumn<Supplier>[] = [
    {
      key: "name",
      header: t("suppliers.name"),
      render: (supplier) => <SupplierNameCell supplier={supplier} />,
    },
    {
      key: "phone",
      header: t("common.phone"),
      render: (supplier) => (
        <span className="text-slate-500">{supplier.phone ?? "—"}</span>
      ),
    },
    {
      key: "balance",
      header: t("suppliers.balance"),
      render: (supplier) => {
        const balance = balanceBySupplier.get(supplier.id);
        if (!balance) return <span className="text-slate-400">—</span>;
        const amount = Number(balance.balance);
        return (
          <span
            className={
              amount > 0 ? "font-medium text-danger-600" : "text-slate-400"
            }
          >
            {formatMoney(amount)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("common.status"),
      render: (supplier) => (
        <Badge tone={supplier.is_active ? "success" : "neutral"}>
          {supplier.is_active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (supplier) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-warning-700 hover:bg-warning-50"
            onClick={(event) => openEdit(supplier, event)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              supplier.is_active
                ? "text-danger-600 hover:bg-danger-50"
                : "text-success-700 hover:bg-success-50"
            }
            onClick={(event) => {
              event.stopPropagation();
              setStatusTarget({
                supplier,
                nextActive: !supplier.is_active,
              });
            }}
          >
            {supplier.is_active && <Trash2 className="h-3.5 w-3.5" aria-hidden />}
            {supplier.is_active ? t("common.deactivate") : t("common.activate")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("suppliers.title")}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("suppliers.new")}
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("suppliers.searchPlaceholder")}
        className="max-w-sm"
      />

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(supplier) => supplier.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("suppliers.noSuppliers")}
          emptyDescription={t("suppliers.noSuppliersHint")}
          onRowClick={(supplier) => navigate(`/suppliers/${supplier.id}`)}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {statusTarget && (
        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={
            statusTarget.nextActive
              ? t("suppliers.activateTitle")
              : t("suppliers.deactivateTitle")
          }
          description={
            statusTarget.nextActive
              ? t("suppliers.activateDescription")
              : t("suppliers.deactivateDescription")
          }
          destructive={!statusTarget.nextActive}
          confirmLabel={
            statusTarget.nextActive ? t("common.activate") : t("common.deactivate")
          }
          loading={statusMutation.isPending}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.supplier.id,
              active: statusTarget.nextActive,
            })
          }
        />
      )}
    </div>
  );
}
