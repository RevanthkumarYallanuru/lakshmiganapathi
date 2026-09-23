import { useEffect, useState } from "react";

import { Alert, Button, ConfirmDialog, Dialog, Input } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { CreatePayableInput } from "@/api/endpoints/payables";

export function PayableFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  formError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreatePayableInput) => void;
  isSubmitting: boolean;
  formError: string | null;
}) {
  const { t } = useLanguage();

  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setPayeeName("");
      setAmount("");
      setReason("");
    }
  }, [open]);

  const isDirty = !!payeeName.trim() || !!amount || !!reason.trim();
  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  const numericAmount = Number(amount) || 0;
  const canSubmit =
    !!payeeName.trim() && numericAmount > 0 && !!reason.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      payee_name: payeeName.trim(),
      total_amount: numericAmount,
      reason: reason.trim(),
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
          <Input
            label={t("payables.name")}
            placeholder={t("payables.namePlaceholder")}
            value={payeeName}
            onChange={(event) => setPayeeName(event.target.value)}
          />

          <Input
            label={t("payables.amount")}
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
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
