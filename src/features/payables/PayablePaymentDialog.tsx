import { useEffect, useState } from "react";

import { Alert, Button, Dialog, Input } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney } from "@/lib/money";
import type { Payable } from "@/types";

export interface PayablePaymentSubmitValues {
  amount: number;
}

/** Records one payment (partial or final) against an existing
 * payable — never edits total_amount, just appends to the payment
 * history and lets the backend recompute amount_paid/status. */
export function PayablePaymentDialog({
  open,
  payable,
  onOpenChange,
  onSubmit,
  isSubmitting,
  formError,
}: {
  open: boolean;
  payable: Payable | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PayablePaymentSubmitValues) => void;
  isSubmitting: boolean;
  formError: string | null;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) setAmount("");
  }, [open]);

  if (!payable) return null;

  const remaining = Math.max(
    0,
    Number(payable.total_amount) - Number(payable.amount_paid)
  );
  const numericAmount = Number(amount) || 0;
  const canSubmit = numericAmount > 0 && numericAmount <= remaining;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ amount: numericAmount });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("payables.makePayment")} — ${payable.suppliers?.name}`}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          {t("payables.remaining")}:{" "}
          <span className="font-medium text-danger-600">
            {formatMoney(remaining)}
          </span>
        </p>

        <Input
          label={t("payables.paymentAmount")}
          type="number"
          min="0"
          max={remaining}
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          autoFocus
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAmount(String(remaining))}
          className="self-start"
        >
          {t("billing.payInFull")}
        </Button>

        {formError && <Alert tone="danger">{formError}</Alert>}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>
            {t("payables.makePayment")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
