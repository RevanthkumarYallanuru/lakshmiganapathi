import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/client";
import { setCustomerOpeningBalance } from "@/api/endpoints/ledger";
import { queryKeys } from "@/api/queryKeys";
import { Alert, Button, Dialog, Input, useToast } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";

/** ADMIN-only, one-time action for onboarding a customer who already
 * owed money before this system was in use. Records a single ledger
 * ADJUSTMENT entry (never a fake sale) — the backend refuses this once
 * the customer has any real transaction history. */
export function OpeningBalanceDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      setCustomerOpeningBalance(customerId, Number(amount), notes.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.balance(customerId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.ledger.allEntries(customerId),
      });
      toast({ variant: "success", title: t("customers.openingBalanceSuccess") });
      setAmount("");
      setNotes("");
      setFormError(null);
      onOpenChange(false);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFormError(null);
        }
        onOpenChange(next);
      }}
      title={t("customers.setOpeningBalance")}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          {t("customers.openingBalanceHint")}
        </p>
        <Input
          label={t("customers.openingBalanceAmount")}
          type="number"
          min="0"
          step="0.01"
          autoFocus
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          label={t("common.notes")}
          optional
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {formError && <Alert tone="danger">{formError}</Alert>}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!amount || Number(amount) <= 0}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
