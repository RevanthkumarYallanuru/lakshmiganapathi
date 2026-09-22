import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCategory,
  listCategories,
  setCategoryActive,
  updateCategory,
  type CategoryInput,
} from "@/api/endpoints/categories";
import { queryKeys } from "@/api/queryKeys";
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
import { CategoryFormDialog } from "@/features/categories/CategoryFormDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { ApiError } from "@/api/client";
import type { Category } from "@/types";

function CategoryNameCell({ category }: { category: Category }) {
  const name = useLocalizedName(category.name, category.telugu_name);
  return <span className="font-medium text-slate-800">{name}</span>;
}

export function CategoriesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    category: Category;
    nextActive: boolean;
  } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.categories.list(debouncedSearch),
    queryFn: () => listCategories(debouncedSearch || undefined),
    placeholderData: keepPreviousData,
  });

  const categories = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(categories);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
  }

  const createMutation = useMutation({
    mutationFn: (values: CategoryInput) => createCategory(values),
    onSuccess: async () => {
      invalidate();
      toast({ variant: "success", title: t("categories.createSuccess") });
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
    mutationFn: ({ id, values }: { id: string; values: Partial<CategoryInput> }) =>
      updateCategory(id, values),
    onSuccess: async () => {
      invalidate();
      toast({ variant: "success", title: t("categories.updateSuccess") });
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
      setCategoryActive(id, active),
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

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  function handleSubmit(values: CategoryInput) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns: TableColumn<Category>[] = [
    {
      key: "name",
      header: t("categories.name"),
      render: (category) => <CategoryNameCell category={category} />,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (category) => (
        <Badge tone={category.is_active ? "success" : "neutral"}>
          {category.is_active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (category) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-warning-700 hover:bg-warning-50"
            onClick={() => openEdit(category)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              category.is_active
                ? "text-danger-600 hover:bg-danger-50"
                : "text-success-700 hover:bg-success-50"
            }
            onClick={() =>
              setStatusTarget({
                category,
                nextActive: !category.is_active,
              })
            }
          >
            {category.is_active && <Trash2 className="h-3.5 w-3.5" aria-hidden />}
            {category.is_active ? t("common.deactivate") : t("common.activate")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("categories.title")}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("categories.new")}
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("categories.searchPlaceholder")}
        className="max-w-sm"
      />

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(category) => category.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("categories.noCategories")}
          emptyDescription={t("categories.noCategoriesHint")}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {statusTarget && (
        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={
            statusTarget.nextActive
              ? t("categories.activateTitle")
              : t("categories.deactivateTitle")
          }
          description={
            statusTarget.nextActive
              ? ""
              : t("categories.deactivateDescription")
          }
          destructive={!statusTarget.nextActive}
          confirmLabel={
            statusTarget.nextActive ? t("common.activate") : t("common.deactivate")
          }
          loading={statusMutation.isPending}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.category.id,
              active: statusTarget.nextActive,
            })
          }
        />
      )}
    </div>
  );
}
