import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";

import {
  createItemUnit,
  listItemUnits,
  updateItemUnit,
} from "@/api/endpoints/items";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  LoadingState,
  useToast,
} from "@/components/ui";
import { ApiError } from "@/api/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney } from "@/lib/money";
import type { Item } from "@/types";

export function ItemUnitsDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [unitName, setUnitName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);

  const itemId = item?.id ?? "";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.items.units(itemId),
    queryFn: () => listItemUnits(itemId),
    enabled: open && !!itemId,
  });

  const units = data?.data ?? [];

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.items.units(itemId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all() }),
    ]);
  }

  const addMutation = useMutation({
    mutationFn: () =>
      createItemUnit(itemId, {
        unit: unitName.trim(),
        standard_price: Number(unitPrice),
        is_default: makeDefault || units.length === 0,
      }),
    onSuccess: async () => {
      invalidate();
      setUnitName("");
      setUnitPrice("");
      setMakeDefault(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ unitId, is_active }: { unitId: string; is_active: boolean }) =>
      updateItemUnit(itemId, unitId, { is_active }),
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (unitId: string) =>
      updateItemUnit(itemId, unitId, { is_default: true }),
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!unitName.trim() || !unitPrice) return;
    addMutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("items.units")} — ${item?.english_name ?? ""}`}
      size="md"
    >
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <LoadingState label={t("common.loading")} />
        ) : units.length === 0 ? (
          <EmptyState title={t("items.noUnitsYet")} />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-control border border-slate-200">
            {units.map((unit) => (
              <li
                key={unit.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">
                    {unit.unit}
                  </span>
                  <span className="text-slate-500">
                    {formatMoney(unit.standard_price)}
                  </span>
                  {unit.is_default && (
                    <Badge tone="accent">{t("items.defaultUnit")}</Badge>
                  )}
                  {!unit.is_active && (
                    <Badge tone="neutral">{t("common.inactive")}</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {!unit.is_default && unit.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => defaultMutation.mutate(unit.id)}
                      aria-label={t("items.defaultUnit")}
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleMutation.mutate({
                        unitId: unit.id,
                        is_active: !unit.is_active,
                      })
                    }
                  >
                    {unit.is_active ? t("common.deactivate") : t("common.activate")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3"
        >
          <Input
            label={t("items.unit")}
            placeholder="KG"
            value={unitName}
            onChange={(event) => setUnitName(event.target.value)}
            className="w-24"
          />
          <Input
            label={t("items.standardPrice")}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            className="w-28"
          />
          <label className="mb-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={makeDefault}
              onChange={(event) => setMakeDefault(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            {t("items.defaultUnit")}
          </label>
          <Button
            type="submit"
            size="sm"
            loading={addMutation.isPending}
            disabled={!unitName.trim() || !unitPrice}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("items.addUnit")}
          </Button>
        </form>

        {units.length === 0 && (
          <p className="text-xs text-slate-400">{t("items.unitsOptionalHint")}</p>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
