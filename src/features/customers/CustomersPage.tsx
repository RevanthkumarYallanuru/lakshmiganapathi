import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCustomer,
  listCustomers,
  setCustomerActive,
  updateCustomer,
} from "@/api/endpoints/customers";
import { getOutstandingReport } from "@/api/endpoints/reports";
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
  CustomerFormDialog,
  type CustomerFormValues,
} from "@/features/customers/CustomerFormDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import type { Customer } from "@/types";

function CustomerNameCell({ customer }: { customer: Customer }) {
  const name = useLocalizedName(customer.english_name, customer.telugu_name);
  return (
    <div>
      <p className="font-medium text-slate-800">{name}</p>
      <p className="text-xs text-slate-400">{customer.customer_code}</p>
    </div>
  );
}

export function CustomersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    customer: Customer;
    nextActive: boolean;
  } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.customers.list(debouncedSearch),
    queryFn: () => listCustomers(debouncedSearch || undefined),
    placeholderData: keepPreviousData,
  });

  // Balance + last transaction come from the reporting view in one
  // bulk call — avoids an N+1 fetch per row for a simple list column.
  const { data: outstandingData } = useQuery({
    queryKey: queryKeys.reports.outstanding({ onlyOutstanding: false }),
    queryFn: () => getOutstandingReport({ onlyOutstanding: false }),
    placeholderData: keepPreviousData,
  });
  const balanceByCustomer = new Map(
    (outstandingData?.data ?? []).map((row) => [row.customer_id, row])
  );

  const customers = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(customers);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
  }

  const createMutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      createCustomer({
        customer_code: values.customer_code,
        english_name: values.english_name,
        telugu_name: values.telugu_name || undefined,
        phone: values.phone || undefined,
        alternate_phone: values.alternate_phone || undefined,
        place: values.place || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: async () => {
      invalidate();
      toast({ variant: "success", title: t("customers.createSuccess") });
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
    mutationFn: ({ id, values }: { id: string; values: CustomerFormValues }) =>
      updateCustomer(id, {
        customer_code: values.customer_code,
        english_name: values.english_name,
        telugu_name: values.telugu_name || undefined,
        phone: values.phone || undefined,
        alternate_phone: values.alternate_phone || undefined,
        place: values.place || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: async () => {
      invalidate();
      toast({ variant: "success", title: t("customers.updateSuccess") });
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
      setCustomerActive(id, active),
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

  function openEdit(customer: Customer, event?: React.MouseEvent) {
    event?.stopPropagation();
    setEditing(customer);
    setFormOpen(true);
  }

  function handleSubmit(values: CustomerFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns: TableColumn<Customer>[] = [
    {
      key: "name",
      header: t("customers.englishName"),
      render: (customer) => <CustomerNameCell customer={customer} />,
    },
    {
      key: "phone",
      header: t("common.phone"),
      render: (customer) => (
        <span className="text-slate-500">{customer.phone ?? "—"}</span>
      ),
    },
    {
      key: "balance",
      header: t("customers.outstanding"),
      render: (customer) => {
        const balance = balanceByCustomer.get(customer.id);
        if (!balance) return <span className="text-slate-400">—</span>;
        const amount = Number(balance.outstanding_balance);
        return (
          <span
            className={
              amount > 0
                ? "font-medium text-danger-600"
                : "text-slate-400"
            }
          >
            {formatMoney(amount)}
          </span>
        );
      },
    },
    {
      key: "lastTransaction",
      header: t("customers.lastTransaction"),
      render: (customer) => {
        const balance = balanceByCustomer.get(customer.id);
        return (
          <span className="text-slate-500">
            {balance?.last_transaction_at
              ? formatDate(balance.last_transaction_at, true)
              : "—"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("common.status"),
      render: (customer) => (
        <Badge tone={customer.is_active ? "success" : "neutral"}>
          {customer.is_active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (customer) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-warning-700 hover:bg-warning-50"
            onClick={(event) => openEdit(customer, event)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              customer.is_active
                ? "text-danger-600 hover:bg-danger-50"
                : "text-success-700 hover:bg-success-50"
            }
            onClick={(event) => {
              event.stopPropagation();
              setStatusTarget({
                customer,
                nextActive: !customer.is_active,
              });
            }}
          >
            {customer.is_active && <Trash2 className="h-3.5 w-3.5" aria-hidden />}
            {customer.is_active ? t("common.deactivate") : t("common.activate")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("customers.title")}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("customers.new")}
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("customers.searchPlaceholder")}
        className="max-w-sm"
      />

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(customer) => customer.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("customers.noCustomers")}
          emptyDescription={t("customers.noCustomersHint")}
          onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {statusTarget && (
        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={
            statusTarget.nextActive
              ? t("customers.activateTitle")
              : t("customers.deactivateTitle")
          }
          description={
            statusTarget.nextActive
              ? t("customers.activateDescription")
              : t("customers.deactivateDescription")
          }
          destructive={!statusTarget.nextActive}
          confirmLabel={
            statusTarget.nextActive ? t("common.activate") : t("common.deactivate")
          }
          loading={statusMutation.isPending}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.customer.id,
              active: statusTarget.nextActive,
            })
          }
        />
      )}
    </div>
  );
}
