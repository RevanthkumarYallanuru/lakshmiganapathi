import { IndianRupee } from "lucide-react";

import { Badge, Button, Dialog } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";
import { formatDate, formatMoney } from "@/lib/money";
import type { Payable, PayableStatus } from "@/types";

const STATUS_TONE: Record<PayableStatus, "neutral" | "warning" | "success"> = {
  PENDING: "neutral",
  PARTIALLY_PAID: "warning",
  PAID: "success",
};

const STATUS_LABEL_KEY: Record<PayableStatus, TranslationKey> = {
  PENDING: "payables.statusPending",
  PARTIALLY_PAID: "payables.statusPartiallyPaid",
  PAID: "payables.statusPaid",
};

export function PayableDetailDialog({
  open,
  payable,
  onOpenChange,
  onMakePayment,
}: {
  open: boolean;
  payable: Payable | null;
  onOpenChange: (open: boolean) => void;
  onMakePayment: () => void;
}) {
  const { t } = useLanguage();

  if (!payable) return null;

  const remaining = Math.max(
    0,
    Number(payable.total_amount) - Number(payable.amount_paid)
  );
  const history = payable.payable_payments ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("payables.details")}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">{t("payables.toWhom")}</p>
            <p className="text-base font-semibold text-slate-900">
              {payable.payee_name}
            </p>
          </div>
          <Badge tone={STATUS_TONE[payable.status]}>
            {t(STATUS_LABEL_KEY[payable.status])}
          </Badge>
        </div>

        <div>
          <p className="text-xs text-slate-400">{t("payables.forWhat")}</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {payable.reason}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-control border border-slate-200 p-3 text-center">
          <div>
            <p className="text-xs text-slate-400">{t("payables.originalAmount")}</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatMoney(payable.total_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("payables.totalPaid")}</p>
            <p className="text-sm font-semibold text-success-700">
              {formatMoney(payable.amount_paid)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("payables.remaining")}</p>
            <p className="text-sm font-semibold text-danger-600">
              {formatMoney(remaining)}
            </p>
          </div>
        </div>

        {payable.paid_at && (
          <p className="text-sm text-slate-500">
            {t("payables.paidDate")}:{" "}
            <span className="font-medium text-slate-800">
              {formatDate(payable.paid_at)}
            </span>
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            {t("payables.paymentHistory")}
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">{t("payables.noPaymentsYet")}</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-control border border-slate-200">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-slate-500">
                    {formatDate(entry.payment_date)}
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatMoney(entry.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          {payable.status !== "PAID" && (
            <Button onClick={onMakePayment}>
              <IndianRupee className="h-4 w-4" aria-hidden />
              {t("payables.makePayment")}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
