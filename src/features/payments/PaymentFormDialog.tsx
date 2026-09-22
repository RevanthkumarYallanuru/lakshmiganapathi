import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listBills } from "@/api/endpoints/billing";
import { getCustomerBalance } from "@/api/endpoints/ledger";
import { queryKeys } from "@/api/queryKeys";
import {
  Alert,
  Button,
  ConfirmDialog,
  Dialog,
  Input,
  Select,
} from "@/components/ui";
import { CustomerPicker } from "@/features/shared/CustomerPicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { formatMoney } from "@/lib/money";
import type { Bill, Customer, PaymentMethod } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export interface PaymentSubmitValues {
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  allocations: { bill_id: string; amount: number }[];
}

/**
 * Bill outstanding shown here is a client-side guide only — computed
 * from the bill's own payment_allocations, it does not know about a
 * reversed payment (the backend does). The server always re-validates
 * and returns a clear error if this guess is stale.
 */
function billOutstanding(bill: Bill): number {
  const allocated = (bill.payment_allocations ?? []).reduce(
    (sum, allocation) => sum + Number(allocation.allocated_amount),
    0
  );
  return Math.max(0, Number(bill.grand_total) - allocated);
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  formError,
  initialCustomer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PaymentSubmitValues) => void;
  isSubmitting: boolean;
  formError: string | null;
  /** Pre-select a customer, e.g. opening this from their profile page —
   * skips the picker instead of forcing a redundant re-search. */
  initialCustomer?: Customer | null;
}) {
  const { t } = useLanguage();

  const [customer, setCustomer] = useState<Customer | null>(initialCustomer ?? null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setCustomer(initialCustomer ?? null);
    } else {
      setCustomer(null);
      setAmount("");
      setMethod("");
      setReference("");
      setNotes("");
      setAllocations({});
    }
  }, [open, initialCustomer]);

  const { data: balanceData } = useQuery({
    queryKey: queryKeys.ledger.balance(customer?.id ?? ""),
    queryFn: () => getCustomerBalance(customer!.id),
    enabled: !!customer,
  });

  const { data: billsData } = useQuery({
    queryKey: queryKeys.bills.list({ customer_id: customer?.id, bill_status: "COMPLETED" }),
    queryFn: () =>
      listBills({ customer_id: customer!.id, bill_status: "COMPLETED" }),
    enabled: !!customer,
  });

  const outstandingBills = (billsData?.data ?? []).filter(
    (bill) => billOutstanding(bill) > 0
  );

  const paymentAmount = Number(amount) || 0;
  const allocatedTotal = Object.values(allocations).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );
  const unallocated = Math.max(0, paymentAmount - allocatedTotal);
  const customerBalance = Number(balanceData?.balance ?? 0);

  function setAllocation(billId: string, value: string) {
    setAllocations((prev) => ({ ...prev, [billId]: value }));
  }

  const isDirty =
    paymentAmount > 0 || (!initialCustomer && !!customer);
  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  function handleSubmit() {
    if (!customer || !method || paymentAmount <= 0) return;

    onSubmit({
      customer_id: customer.id,
      amount: paymentAmount,
      payment_method: method,
      reference_number: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      allocations: Object.entries(allocations)
        .map(([bill_id, value]) => ({ bill_id, amount: Number(value) || 0 }))
        .filter((allocation) => allocation.amount > 0),
    });
  }

  const canSubmit =
    !!customer && !!method && paymentAmount > 0 && allocatedTotal <= paymentAmount;

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={requestClose}
      title={t("payments.new")}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <CustomerPicker
          value={customer}
          onChange={setCustomer}
          label={t("payments.customer")}
        />

        {customer && (
          <p className="text-sm text-slate-500">
            {t("customers.outstanding")}:{" "}
            <span className="font-medium text-slate-800">
              {formatMoney(customerBalance)}
            </span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("payments.amount")}
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Select
            label={t("payments.method")}
            value={method}
            onValueChange={(value) => setMethod(value as PaymentMethod)}
            options={PAYMENT_METHODS}
          />
          <Input
            label={t("payments.reference")}
            optional
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
          <Input
            label={t("common.notes")}
            optional
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {customer && (
          <div className="rounded-control border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">
              {t("payments.allocations")}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {t("payments.allocationsHint")}
            </p>

            {outstandingBills.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                {t("payments.noOutstandingBills")}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {outstandingBills.map((bill) => {
                  const outstanding = billOutstanding(bill);
                  return (
                    <li
                      key={bill.id}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {bill.bill_number}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t("customers.outstanding")}: {formatMoney(outstanding)}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={outstanding}
                        step="0.01"
                        value={allocations[bill.id] ?? ""}
                        onChange={(event) =>
                          setAllocation(bill.id, event.target.value)
                        }
                        placeholder="0.00"
                        className="h-9 w-28 rounded-control border border-slate-300 bg-white px-2 text-right text-sm"
                      />
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-sm">
              <span className="text-slate-500">
                {t("payments.allocatedAmount")}: {formatMoney(allocatedTotal)}
              </span>
              <span
                className={
                  unallocated > 0 ? "text-slate-500" : "text-slate-400"
                }
              >
                {t("payments.unallocatedAmount")}: {formatMoney(unallocated)}
              </span>
            </div>
          </div>
        )}

        {formError && <Alert tone="danger">{formError}</Alert>}

        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => requestClose(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            {t("payments.recordPayment")}
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
