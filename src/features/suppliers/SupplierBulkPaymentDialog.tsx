import { useEffect, useState } from "react";

import { Alert, Button, Dialog, Input } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney } from "@/lib/money";
import type { Supplier } from "@/types";

export interface SupplierBulkPaymentSubmitValues {
  amount: number;
}

/** Records one bulk payment against a supplier's outstanding balance —
 * the amount is automatically allocated across the supplier's oldest
 * unpaid/partially-paid payables first (FIFO) server-side. No manual
 * bill selection here by design; to settle one specific payable out of
 * order, use that payable's own detail view instead. */
export function SupplierBulkPaymentDialog({
  open,
  supplier,
  balance,
  onOpenChange,
  onSubmit,
  isSubmitting,
  formError,
}: {
  open: boolean;
  supplier: Supplier | null;
  balance: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SupplierBulkPaymentSubmitValues) => void;
  isSubmitting: boolean;
  formError: string | null;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) setAmount("");
  }, [open]);

  if (!supplier) return null;

  const remaining = Math.max(0, Number(balance));
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
      title={`${t("payables.makePayment")} — ${supplier.name}`}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          {t("suppliers.totalBalance")}:{" "}
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

        <p className="text-xs text-slate-400">
          {t("suppliers.bulkPaymentNote")}
        </p>

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
