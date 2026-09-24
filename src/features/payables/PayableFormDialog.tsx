import { useEffect, useState } from "react";

import { Alert, Button, ConfirmDialog, Dialog, Input } from "@/components/ui";
import { SupplierPicker } from "@/features/shared/SupplierPicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { CreatePayableInput } from "@/api/endpoints/payables";
import type { Supplier } from "@/types";

function todayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function PayableFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  formError,
  initialSupplier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreatePayableInput) => void;
  isSubmitting: boolean;
  formError: string | null;
  /** Pre-fills and locks the supplier when opened from a Supplier
   * Profile's "New Pay" action — still shown as a normal picker chip,
   * just already selected. */
  initialSupplier?: Supplier | null;
}) {
  const { t } = useLanguage();

  const [supplier, setSupplier] = useState<Supplier | null>(
    initialSupplier ?? null
  );
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [payableDate, setPayableDate] = useState(todayDateString());

  useEffect(() => {
    if (open) {
      setSupplier(initialSupplier ?? null);
    } else {
      setSupplier(null);
      setAmount("");
      setReason("");
      setPayableDate(todayDateString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isDirty =
    !!supplier ||
    !!amount ||
    !!reason.trim() ||
    payableDate !== todayDateString();
  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  const numericAmount = Number(amount) || 0;
  const canSubmit =
    !!supplier && numericAmount > 0 && !!reason.trim() && !!payableDate;

  function handleSubmit() {
    if (!canSubmit || !supplier) return;
    onSubmit({
      supplier_id: supplier.id,
      total_amount: numericAmount,
      reason: reason.trim(),
      payable_date: payableDate,
    });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={requestClose}
        title={t("payables.newPayment")}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <SupplierPicker
            label={t("suppliers.title")}
            value={supplier}
            onChange={setSupplier}
          />

          <Input
            label={t("payables.amount")}
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />

          <Input
            label={t("payables.payableDate")}
            type="date"
            value={payableDate}
            onChange={(event) => setPayableDate(event.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t("payables.reason")}
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("payables.reasonPlaceholder")}
              className="rounded-control border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1"
            />
          </div>

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
