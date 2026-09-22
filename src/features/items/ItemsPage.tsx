import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";

import { listCategories } from "@/api/endpoints/categories";
import {
  createItem,
  listItems,
  setItemActive,
  updateItem,
} from "@/api/endpoints/items";
import { queryKeys } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import {
  Badge,
  Button,
  ConfirmDialog,
  Pagination,
  SearchInput,
  Select,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { ItemFormDialog, type ItemFormValues } from "@/features/items/ItemFormDialog";
import { ItemUnitsDialog } from "@/features/items/ItemUnitsDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Item } from "@/types";

function ItemNameCell({ item }: { item: Item }) {
  const name = useLocalizedName(item.english_name, item.telugu_name);
  return (
    <div>
      <p className="font-medium text-slate-800">{name}</p>
      <p className="text-xs text-slate-400">{item.item_code}</p>
    </div>
  );
}

export function ItemsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [unitsTarget, setUnitsTarget] = useState<Item | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    item: Item;
    nextActive: boolean;
  } | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => listCategories(),
  });
  const categories = categoriesData?.data ?? [];

  const listParams = {
    search: debouncedSearch || undefined,
    categoryId: categoryFilter || undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.items.list(listParams),
    queryFn: () => listItems(listParams),
    placeholderData: keepPreviousData,
  });

  const items = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(items);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.items.all() });
  }

  const createMutation = useMutation({
    mutationFn: (values: ItemFormValues) =>
      createItem({
        item_code: values.item_code,
        english_name: values.english_name,
        telugu_name: values.telugu_name || undefined,
        category_id: values.category_id || undefined,
        description: values.description || undefined,
      }),
    onSuccess: async (created) => {
      invalidate();
      toast({ variant: "success", title: t("items.createSuccess") });
      setFormOpen(false);
      setUnitsTarget(created);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ItemFormValues }) =>
      updateItem(id, {
        item_code: values.item_code,
        english_name: values.english_name,
        telugu_name: values.telugu_name || undefined,
        category_id: values.category_id || undefined,
        description: values.description || undefined,
      }),
    onSuccess: async () => {
      invalidate();
      toast({ variant: "success", title: t("items.updateSuccess") });
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
      setItemActive(id, active),
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

  function openEdit(item: Item) {
    setEditing(item);
    setFormOpen(true);
  }

  function handleSubmit(values: ItemFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns: TableColumn<Item>[] = [
    {
      key: "name",
      header: t("items.englishName"),
      render: (item) => <ItemNameCell item={item} />,
    },
    {
      key: "category",
      header: t("items.category"),
      render: (item) => (
        <span className="text-slate-500">
          {item.categories?.name ?? t("items.noCategory")}
        </span>
      ),
    },
    {
      key: "units",
      header: t("items.units"),
      render: (item) => {
        const units = (item.item_units ?? []).filter((u) => u.is_active);
        if (units.length === 0) {
          return <span className="text-slate-400">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {units.map((unit) => (
              <Badge key={unit.id} tone="neutral">
                {unit.unit}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {!item.is_active && (
            <Badge tone="neutral">{t("common.inactive")}</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUnitsTarget(item)}
          >
            <Ruler className="h-3.5 w-3.5" aria-hidden />
            {t("items.units")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-warning-700 hover:bg-warning-50"
            onClick={() => openEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              item.is_active
                ? "text-danger-600 hover:bg-danger-50"
                : "text-success-700 hover:bg-success-50"
            }
            onClick={() =>
              setStatusTarget({ item, nextActive: !item.is_active })
            }
          >
            {item.is_active && <Trash2 className="h-3.5 w-3.5" aria-hidden />}
            {item.is_active ? t("common.deactivate") : t("common.activate")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("items.title")}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("items.new")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("items.searchPlaceholder")}
          className="max-w-sm flex-1"
        />
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder={t("items.allCategories")}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("items.noItems")}
          emptyDescription={t("items.noItemsHint")}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editing}
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ItemUnitsDialog
        open={!!unitsTarget}
        onOpenChange={(open) => !open && setUnitsTarget(null)}
        item={unitsTarget}
      />

      {statusTarget && (
        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={
            statusTarget.nextActive
              ? t("items.activateTitle")
              : t("items.deactivateTitle")
          }
          description={
            statusTarget.nextActive ? "" : t("items.deactivateDescription")
          }
          destructive={!statusTarget.nextActive}
          confirmLabel={
            statusTarget.nextActive ? t("common.activate") : t("common.deactivate")
          }
          loading={statusMutation.isPending}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.item.id,
              active: statusTarget.nextActive,
            })
          }
        />
      )}
    </div>
  );
}
