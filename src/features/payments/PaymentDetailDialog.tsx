import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";

import { ApiError } from "@/api/client";
import { cancelPayment, getPayment } from "@/api/endpoints/payments";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  ErrorState,
  Input,
  LoadingState,
  useToast,
} from "@/components/ui";
import { PrintablePaymentReceipt } from "@/features/payments/PrintablePaymentReceipt";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import { generatePaymentPdf } from "@/lib/paymentPdf";

export function PaymentDetailDialog({
  paymentId,
  onOpenChange,
}: {
  paymentId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { hasRole, business } = useAuth();
  const queryClient = useQueryClient();

  const [reverseOpen, setReverseOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleDownloadPdf() {
    if (!payment) return;
    setDownloadingPdf(true);
    try {
      const ledgerEntry = (payment.ledger_entries ?? []).find(
        (entry) => entry.entry_type === "PAYMENT"
      );
      const balanceAfter = ledgerEntry ? Number(ledgerEntry.balance_after) : null;
      const previousBalance =
        balanceAfter !== null ? balanceAfter + Number(payment.amount) : null;

      await generatePaymentPdf(payment, {
        businessName: business?.name ?? "Lakshmi Ganapathi Enterprises",
        businessPhone: business?.phone ?? null,
        // jsPDF's built-in fonts are Latin-only — see lib/billPdf.ts.
        customerName: payment.customers?.english_name ?? "",
        previousBalance,
        balanceAfter,
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setDownloadingPdf(false);
    }
  }

  const { data: payment, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.payments.detail(paymentId ?? ""),
    queryFn: () => getPayment(paymentId!),
    enabled: !!paymentId,
  });

  const reverseMutation = useMutation({
    mutationFn: () => cancelPayment(paymentId!, reason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.detail(paymentId ?? ""),
      });
      if (payment?.customer_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.ledger.balance(payment.customer_id),
        });
      }
      toast({ variant: "success", title: t("payments.cancelSuccess") });
      setReverseOpen(false);
      setReason("");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const isReversed = (payment?.ledger_entries ?? []).some(
    (entry) => entry.entry_type === "ADJUSTMENT"
  );

  return (
    <Dialog
      open={!!paymentId}
      onOpenChange={onOpenChange}
      title={t("payments.details")}
      size="md"
    >
      {isLoading && <LoadingState label={t("common.loading")} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {payment && (
        <div className="flex flex-col gap-4">
          <PrintablePaymentReceipt payment={payment} />

          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">
                {payment.payment_number}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate(payment.payment_at, true)}
              </p>
              <p className="text-sm text-slate-700">
                {payment.customers?.english_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isReversed && <Badge tone="danger">Reversed</Badge>}
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" aria-hidden />
                {t("common.print")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                loading={downloadingPdf}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {t("billing.downloadPdf")}
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500">{t("payments.amount")}</dt>
            <dd className="text-right font-medium text-slate-800">
              {formatMoney(payment.amount)}
            </dd>
            <dt className="text-slate-500">{t("payments.method")}</dt>
            <dd className="text-right text-slate-800">
              {payment.payment_method}
            </dd>
            {payment.reference_number && (
              <>
                <dt className="text-slate-500">{t("payments.reference")}</dt>
                <dd className="text-right text-slate-800">
                  {payment.reference_number}
                </dd>
              </>
            )}
          </dl>

          {(payment.payment_allocations?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700">
                {t("payments.allocatedTo")}
              </p>
              <ul className="mt-1 divide-y divide-slate-100">
                {payment.payment_allocations!.map((allocation) => (
                  <li
                    key={allocation.id}
                    className="flex justify-between py-1.5 text-sm"
                  >
                    <span className="text-slate-600">
                      {allocation.bills?.bill_number}
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatMoney(allocation.allocated_amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {payment.notes && (
            <p className="text-sm text-slate-500">{payment.notes}</p>
          )}

          {!isReversed && (
            <div className="flex justify-end border-t border-slate-100 pt-3">
              {hasRole("ADMIN") ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setReverseOpen(true)}
                >
                  {t("payments.reverse")}
                </Button>
              ) : (
                <p className="text-xs text-slate-400">
                  {t("payments.adminOnly")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={reverseOpen}
        onOpenChange={setReverseOpen}
        title={t("payments.cancelTitle")}
        description={t("payments.cancelDescription")}
        confirmLabel={t("payments.reverse")}
        loading={reverseMutation.isPending}
        onConfirm={() => reverseMutation.mutate()}
      >
        <Input
          label={t("payments.cancelReason")}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </ConfirmDialog>
    </Dialog>
  );
}
