import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { ApiError } from "@/api/client";
import { createBill } from "@/api/endpoints/billing";
import { assignDelivery, listDeliveryAgents } from "@/api/endpoints/deliveries";
import { getCustomer } from "@/api/endpoints/customers";
import { getCustomerBalance } from "@/api/endpoints/ledger";
import { queryKeys } from "@/api/queryKeys";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Select,
  useToast,
} from "@/components/ui";
import { BillItemRow } from "@/features/billing/BillItemRow";
import {
  computeLineTotal,
  isWeightVariable,
  type BillLineDraft,
} from "@/features/billing/billTypes";
import {
  AgentPicker,
  agentSelectionToPayload,
  EMPTY_AGENT_SELECTION,
  type AgentSelection,
} from "@/features/shared/AgentPicker";
import { CustomerPicker } from "@/features/shared/CustomerPicker";
import { ItemPicker } from "@/features/shared/ItemPicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney } from "@/lib/money";
import type { BillType, Customer, Item, PaymentMethod } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function BillNewPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  // Set only once, from the Customer Profile "Make Bill" entry point —
  // after that the admin drives customer selection entirely through
  // CustomerPicker, same as the Bills -> New Bill flow.
  const preselectCustomerId = searchParams.get("customerId");

  const [billType, setBillType] = useState<BillType>("CUSTOMER");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<BillLineDraft[]>([]);
  const [billDiscount, setBillDiscount] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [notes, setNotes] = useState("");
  const [agentSelection, setAgentSelection] = useState<AgentSelection>(EMPTY_AGENT_SELECTION);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: preselectCustomerData } = useQuery({
    queryKey: queryKeys.customers.detail(preselectCustomerId ?? ""),
    queryFn: () => getCustomer(preselectCustomerId!),
    enabled: !!preselectCustomerId,
  });

  useEffect(() => {
    if (preselectCustomerData) {
      setBillType("CUSTOMER");
      setCustomer(preselectCustomerData);
    }
    // Only reacts to the preselect query resolving — deliberately not
    // re-running on `customer`, so it never overwrites a customer the
    // admin has since picked or changed themselves.
  }, [preselectCustomerData]);

  const { data: agentsData } = useQuery({
    queryKey: queryKeys.deliveryAgents.list(),
    queryFn: () => listDeliveryAgents(),
    enabled: billType === "CUSTOMER",
  });
  const agents = agentsData?.data ?? [];

  const isDirty = lines.length > 0 || !!customer;

  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const { data: balanceData } = useQuery({
    queryKey: queryKeys.ledger.balance(customer?.id ?? ""),
    queryFn: () => getCustomerBalance(customer!.id),
    enabled: billType === "CUSTOMER" && !!customer,
  });

  const previousBalance =
    billType === "CUSTOMER" && customer ? Number(balanceData?.balance ?? 0) : 0;

  const subtotal = lines.reduce((sum, line) => sum + computeLineTotal(line), 0);
  const discount = Math.min(Number(billDiscount) || 0, subtotal);
  const grandTotal = Math.max(0, subtotal - discount);
  // A customer bill allows paying more than the bill's own total —
  // the excess reduces their previous balance instead of being
  // capped/lost. Walk-ins have no previous balance to apply it to, so
  // paying there still can't exceed the bill total (matches the
  // backend, which rejects overpayment for non-customer bills).
  const rawPaid = Number(amountPaid) || 0;
  // A walk-in bill is a complete sale paid in full at the counter — the
  // paid amount is always the total (the backend enforces the same).
  const paid = billType === "CUSTOMER" ? Math.max(0, rawPaid) : grandTotal;
  const effectiveMethod: PaymentMethod | "" =
    billType === "WALK_IN" ? paymentMethod || "CASH" : paymentMethod;
  const currentBillBalance = Math.max(0, grandTotal - paid);
  const excessPaid = Math.max(0, paid - grandTotal);
  const overallBalance = previousBalance + grandTotal - paid;

  const createMutation = useMutation({
    mutationFn: () =>
      createBill({
        bill_type: billType,
        customer_id: billType === "CUSTOMER" ? customer!.id : undefined,
        discount,
        amount_paid: paid,
        payment_method: paid > 0 ? (effectiveMethod as PaymentMethod) : undefined,
        notes: notes.trim() || undefined,
        items: lines.map((line) => ({
          item_id: line.item.id,
          item_unit_id: line.unitId,
          quantity: Number(line.quantity) || 0,
          actual_rate: Number(line.actualRate) || 0,
          discount: Number(line.discount) || 0,
          weights: isWeightVariable(line)
            ? line.weights.map((w) => Number(w) || 0)
            : undefined,
        })),
      }),
    onSuccess: (bill) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.all() });
      if (billType === "CUSTOMER" && customer) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.ledger.balance(customer.id),
        });
      }
      // A delivery record (agent optional, defaults to "Not Assigned")
      // is only meaningful for customer bills — walk-ins are picked up
      // in person. Fire-and-forget: it's a convenience, not something
      // worth making the user wait on — it can always be set/changed
      // later from the bill detail page, which fetches its own
      // delivery record fresh anyway.
      if (billType === "CUSTOMER") {
        assignDelivery({
          bill_id: bill.id,
          ...agentSelectionToPayload(agentSelection),
        }).catch(() => {});
      }
      toast({ variant: "success", title: t("billing.createSuccess") });
      // The bill detail page fetches the bill fresh by id — the
      // server response is the source of truth, no need to wait for
      // background list/ledger/delivery calls before navigating.
      navigate(`/billing/${bill.id}`, { replace: true });
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  function handleAddItem(item: Item) {
    setFormError(null);
    // Units come straight off the item the picker already fetched —
    // listItems() embeds them, so no extra round trip is needed here.
    // That extra fetch used to make every "Add" wait on the network.
    const units = (item.item_units ?? []).filter((u) => u.is_active);

    if (units.length === 0) {
      toast({
        variant: "error",
        title: `${item.english_name} has no active units yet.`,
      });
      return;
    }

    const defaultUnit = units.find((u) => u.is_default) ?? units[0];

    setLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        item,
        units,
        unitId: defaultUnit.id,
        standardRate: Number(defaultUnit.standard_price),
        actualRate: defaultUnit.standard_price,
        quantity: "1",
        discount: "0",
        weights: defaultUnit.is_weight_variable ? [""] : [],
      },
    ]);
  }

  function updateLine(key: string, patch: Partial<BillLineDraft>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((line) => line.key !== key));
  }

  function handleSubmit() {
    setFormError(null);

    if (billType === "CUSTOMER" && !customer) {
      setFormError(t("billing.selectCustomerFirst"));
      return;
    }
    if (lines.length === 0) {
      setFormError(t("billing.noItemsAdded"));
      return;
    }
    if (lines.some((line) => (Number(line.quantity) || 0) <= 0)) {
      setFormError(t("billing.noItemsAdded"));
      return;
    }
    if (
      lines.some(
        (line) =>
          isWeightVariable(line) &&
          (line.weights.length !== (Number(line.quantity) || 0) ||
            line.weights.some((w) => !w || Number(w) <= 0))
      )
    ) {
      setFormError(t("billing.weightsIncomplete"));
      return;
    }
    if (paid > 0 && !effectiveMethod) {
      setFormError(t("billing.paymentMethod"));
      return;
    }

    createMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      <button
        type="button"
        onClick={() => navigate("/billing")}
        className="flex items-center gap-1.5 rounded-control bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("billing.back")}
      </button>

      <h1 className="text-lg font-semibold text-slate-900">
        {t("billing.newBill")}
      </h1>

      <Card>
        <div
          className="inline-flex rounded-control border border-slate-200 bg-slate-50 p-0.5 text-sm"
          role="group"
        >
          {(["CUSTOMER", "WALK_IN"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setBillType(type);
                if (type === "WALK_IN") setCustomer(null);
              }}
              aria-pressed={billType === type}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                billType === type
                  ? "bg-white text-accent-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {type === "CUSTOMER"
                ? t("billing.customerBill")
                : t("billing.walkInBill")}
            </button>
          ))}
        </div>

        {billType === "CUSTOMER" ? (
          <div className="mt-4 flex flex-col gap-4">
            <CustomerPicker
              value={customer}
              onChange={setCustomer}
              label={t("billing.customer")}
            />
            <AgentPicker
              label={t("billing.assignDeliveryAgent")}
              agents={agents}
              value={agentSelection}
              onChange={setAgentSelection}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {t("billing.walkInNotice")}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("billing.items")} />
        <ItemPicker onSelect={handleAddItem} />

        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            {t("billing.selectItem")}
          </p>
        ) : (
          <div className="mt-3">
            <div className="hidden grid-cols-12 gap-3 pb-2 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
              <span className="col-span-3">{t("billing.item")}</span>
              <span className="col-span-2">{t("billing.unit")}</span>
              <span className="col-span-2">{t("billing.quantity")}</span>
              <span className="col-span-2">{t("billing.actualRate")}</span>
              <span className="col-span-1">{t("billing.lineDiscount")}</span>
              <span className="col-span-1 text-right">
                {t("billing.lineTotal")}
              </span>
            </div>
            {lines.map((line) => (
              <BillItemRow
                key={line.key}
                line={line}
                onChange={(patch) => updateLine(line.key, patch)}
                onRemove={() => removeLine(line.key)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={t("common.amount")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t("billing.billDiscount")}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={billDiscount}
              onChange={(event) => setBillDiscount(event.target.value)}
              className="h-10 rounded-control border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          {billType === "WALK_IN" ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                {t("billing.paidNow")}
              </span>
              <div className="flex h-10 items-center justify-between rounded-control border border-slate-200 bg-slate-50 px-3 text-sm">
                <span className="font-medium text-slate-800">
                  {formatMoney(grandTotal)}
                </span>
                <span className="text-xs text-slate-500">
                  {t("billing.walkInPaidInFull")}
                </span>
              </div>
            </div>
          ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {t("billing.paidNow")}
              </label>
              <button
                type="button"
                onClick={() => setAmountPaid(String(grandTotal))}
                className="text-xs font-medium text-accent-600 hover:underline"
              >
                {t("billing.payInFull")}
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="1"
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
              className="h-10 rounded-control border border-slate-300 bg-white px-3 text-sm"
            />
          </div>
          )}

          {paid > 0 && (
            <Select
              label={t("billing.paymentMethod")}
              value={effectiveMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
              options={PAYMENT_METHODS}
            />
          )}

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              {t("common.notes")}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                ({t("common.optional")})
              </span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="h-10 rounded-control border border-slate-300 bg-white px-3 text-sm"
            />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">{t("billing.subtotal")}</dt>
            <dd className="font-medium text-slate-800">
              {formatMoney(subtotal)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("billing.grandTotal")}</dt>
            <dd className="font-medium text-slate-800">
              {formatMoney(grandTotal)}
            </dd>
          </div>
          {billType === "CUSTOMER" && (
            <div>
              <dt className="text-slate-500">{t("billing.previousBalance")}</dt>
              <dd className="font-medium text-slate-800">
                {customer ? formatMoney(previousBalance) : "—"}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500">{t("billing.currentBillBalance")}</dt>
            <dd className="font-medium text-slate-800">
              {formatMoney(currentBillBalance)}
            </dd>
          </div>
          {billType === "CUSTOMER" && customer && excessPaid > 0 && (
            <div>
              <dt className="text-slate-500">{t("billing.partialBalancePaid")}</dt>
              <dd className="font-medium text-success-700">
                {formatMoney(excessPaid)}
              </dd>
            </div>
          )}
          {billType === "CUSTOMER" && customer && (
            <div>
              <dt className="text-slate-500">{t("billing.overallBalance")}</dt>
              <dd className="text-base font-semibold text-accent-700">
                {formatMoney(overallBalance)}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {formError && <Alert tone="danger">{formError}</Alert>}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          loading={createMutation.isPending}
        >
          {t("billing.completeBill")}
        </Button>
      </div>
    </div>
  );
}
