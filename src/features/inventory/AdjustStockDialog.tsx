import { useEffect, useState } from "react";

import { Alert, Button, Dialog, Input } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import type { StockTallyRow } from "@/types";

export interface AdjustStockSubmitValues {
  quantity: number;
  notes?: string;
}

/**
 * Manual stock correction — for stock received from somewhere other
 * than a recorded Import (a previous supplier's leftover stock, a
 * physical recount, wastage, etc.), or simply to fix an item whose
 * displayed remaining stock is stuck at 0 from a historical gap. The
 * admin enters the *correct current quantity*, not a +/- delta — see
 * setItemStock's own doc comment for why; the field is pre-filled with
 * today's displayed stock so increasing or decreasing it is just
 * editing that number up or down.
 */
export function AdjustStockDialog({
  open,
  item,
  onOpenChange,
  onSubmit,
  isSubmitting,
  formError,
}: {
  open: boolean;
  item: StockTallyRow | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdjustStockSubmitValues) => void;
  isSubmitting: boolean;
  formError: string | null;
}) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const itemName = useLocalizedName(
    item?.english_name ?? "",
    item?.telugu_name ?? null
  );

  useEffect(() => {
    if (open && item) {
      setQuantity(item.remaining_stock);
      setNotes("");
    }
  }, [open, item]);

  if (!item) return null;

  const numericQuantity = quantity === "" ? null : Number(quantity);
  const currentQuantity = Number(item.remaining_stock);
  const canSubmit =
    numericQuantity !== null &&
    Number.isFinite(numericQuantity) &&
    numericQuantity >= 0 &&
    numericQuantity !== currentQuantity;

  function handleSubmit() {
    if (!canSubmit || numericQuantity === null) return;
    onSubmit({
      quantity: numericQuantity,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("inventory.adjustStock")} — ${itemName}`}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          {t("inventory.currentStock")}:{" "}
          <span className="font-medium text-slate-800">
            {item.remaining_stock}
          </span>
        </p>

        <Input
          label={t("inventory.newStockQuantity")}
          type="number"
          min="0"
          step="0.001"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          autoFocus
        />

        <Input
          label={t("inventory.adjustNotesOptional")}
          placeholder={t("inventory.adjustNotesPlaceholder")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        {formError && <Alert tone="danger">{formError}</Alert>}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>
            {t("inventory.saveStock")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
