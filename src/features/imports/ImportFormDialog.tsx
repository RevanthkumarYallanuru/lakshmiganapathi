import { useEffect, useState } from "react";
import { Package, X } from "lucide-react";

import { Alert, Button, ConfirmDialog, Dialog, Input } from "@/components/ui";
import type { CreateImportInput } from "@/api/endpoints/imports";
import { ItemPicker } from "@/features/shared/ItemPicker";
import { SupplierPicker } from "@/features/shared/SupplierPicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { formatMoney } from "@/lib/money";
import type { Item, Supplier } from "@/types";

function todayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function SelectedItemChip({
  item,
  onClear,
}: {
  item: Item;
  onClear: () => void;
}) {
  const name = useLocalizedName(item.english_name, item.telugu_name);
  return (
    <div className="flex items-center justify-between rounded-control border border-slate-300 bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-slate-400" aria-hidden />
        <p className="text-sm font-medium text-slate-800">{name}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function ImportFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  formError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateImportInput) => void;
  isSubmitting: boolean;
  formError: string | null;
}) {
  const { t } = useLanguage();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [importDate, setImportDate] = useState(todayDateString());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setSupplier(null);
      setItem(null);
      setQuantity("");
      setUnit("");
      setAmount("");
      setPaidAmount("");
      setImportDate(todayDateString());
      setNotes("");
    }
  }, [open]);

  const isDirty = !!supplier || !!item || !!quantity || !!amount || !!paidAmount;
  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  const numericQuantity = Number(quantity) || 0;
  const numericAmount = Number(amount) || 0;
  const numericPaid = Number(paidAmount) || 0;
  const pending = Math.max(0, numericAmount - numericPaid);

  const canSubmit =
    !!supplier &&
    !!item &&
    numericQuantity > 0 &&
    !!unit.trim() &&
    numericAmount > 0 &&
    numericPaid >= 0 &&
    numericPaid <= numericAmount;

  function handleSubmit() {
    if (!canSubmit || !supplier || !item) return;
    onSubmit({
      supplier_id: supplier.id,
      item_id: item.id,
      quantity: numericQuantity,
      unit: unit.trim(),
      amount: numericAmount,
      paid_amount: numericPaid,
      import_date: importDate,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={requestClose}
        title={t("imports.new")}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <SupplierPicker
            label={t("suppliers.title")}
            value={supplier}
            onChange={setSupplier}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t("imports.item")}
            </label>
            {item ? (
              <SelectedItemChip item={item} onClear={() => setItem(null)} />
            ) : (
              <ItemPicker
                onSelect={(selected) => {
                  setItem(selected);
                  const defaultUnit = selected.item_units?.find(
                    (u) => u.is_default
                  )?.unit;
                  if (defaultUnit) setUnit(defaultUnit);
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("imports.quantity")}
              type="number"
              min="0"
              step="0.001"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <Input
              label={t("imports.unit")}
              placeholder={t("imports.unitPlaceholder")}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("imports.amount")}
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <Input
              label={t("imports.paidAmount")}
              type="number"
              min="0"
              step="1"
              value={paidAmount}
              onChange={(event) => setPaidAmount(event.target.value)}
            />
          </div>

          <p className="text-sm text-slate-500">
            {t("imports.pending")}:{" "}
            <span className="font-medium text-danger-600">
              {formatMoney(pending)}
            </span>
          </p>

          <Input
            label={t("imports.date")}
            type="date"
            value={importDate}
            onChange={(event) => setImportDate(event.target.value)}
          />

          <Input
            label={t("common.notes")}
            optional
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          {formError && <Alert tone="danger">{formError}</Alert>}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => requestClose(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("common.discardChangesTitle")}
        description={t("common.discardChangesDescription")}
        confirmLabel={t("common.discardChanges")}
        cancelLabel={t("common.keepEditing")}
        onConfirm={confirmDiscard}
      />
    </>
  );
}
