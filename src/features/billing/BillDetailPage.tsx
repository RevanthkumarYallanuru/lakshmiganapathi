import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer, XCircle } from "lucide-react";

import { ApiError } from "@/api/client";
import { cancelBill, getBill } from "@/api/endpoints/billing";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Input,
  LoadingState,
  useToast,
} from "@/components/ui";
import { BillDeliveryPanel } from "@/features/billing/BillDeliveryPanel";
import { PrintableBill } from "@/features/billing/PrintableBill";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { formatDate, formatMoney } from "@/lib/money";
import { generateBillPdf } from "@/lib/billPdf";
import type { BillItem } from "@/types";

function ItemNameCell({ line }: { line: BillItem }) {
  const name = useLocalizedName(line.item_name_snapshot, line.items?.telugu_name);
  return <>{name}</>;
}

export function BillDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { business } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const {
    data: bill,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bills.detail(id),
    queryFn: () => getBill(id),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBill(id, reason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.all() });
      if (bill?.customer_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.ledger.balance(bill.customer_id),
        });
      }
      toast({ variant: "success", title: t("billing.cancelSuccess") });
      setCancelOpen(false);
      setReason("");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const customerDisplayName = useLocalizedName(
    bill?.customer_name_snapshot ?? "",
    bill?.customers?.telugu_name
  );

  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (isError || !bill) return <ErrorState onRetry={() => refetch()} />;

  const isCustomerBill = bill.bill_type === "CUSTOMER";

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      await generateBillPdf(bill!, {
        businessName: business?.name ?? "Lakshmi Ganapathi Enterprises",
        businessPhone: business?.phone ?? null,
        alternatePhone: business?.alternate_phone ?? null,
        businessAddress: business?.address ?? null,
        proprietorName: business?.proprietor_name ?? null,
        customerNameEnglish: bill!.customer_name_snapshot ?? "",
        customerNameTelugu: bill!.customers?.telugu_name ?? null,
        printLanguage: business?.print_language ?? "ENGLISH",
        billNote: business?.bill_note?.trim() || t("billing.paymentTermsNote"),
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/billing")}
          className="flex items-center gap-1.5 rounded-control bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("billing.back")}
        </button>
        <div className="flex gap-2">
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
          {bill.status === "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </div>

      <PrintableBill bill={bill} />

      {isCustomerBill && <BillDeliveryPanel billId={bill.id} />}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {bill.bill_number}
            </h1>
            <p className="text-sm text-slate-500">
              {t("billing.transactionTime")}: {formatDate(bill.transaction_at, true)}
            </p>
            {isCustomerBill ? (
              <p className="mt-1 text-sm text-slate-700">
                {customerDisplayName}
                {bill.customer_phone_snapshot
                  ? ` · ${bill.customer_phone_snapshot}`
                  : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                {t("billing.walkInBill")}
              </p>
            )}
          </div>
          <Badge
            tone={
              bill.status === "CANCELLED"
                ? "danger"
                : bill.status === "COMPLETED"
                  ? "success"
                  : "neutral"
            }
          >
            {bill.status}
          </Badge>
        </div>

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="py-2">{t("billing.item")}</th>
              <th className="py-2">{t("billing.unit")}</th>
              <th className="py-2 text-right">{t("billing.quantity")}</th>
              <th className="py-2 text-right">{t("billing.actualRate")}</th>
              <th className="py-2 text-right">{t("billing.lineDiscount")}</th>
              <th className="py-2 text-right">{t("billing.lineTotal")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bill.bill_items.map((line) => (
              <tr key={line.id}>
                <td className="py-2 font-medium text-slate-800">
                  <ItemNameCell line={line} />
                </td>
                <td className="py-2 text-slate-500">{line.unit}</td>
                <td className="py-2 text-right text-slate-700">
                  {line.quantity}
                </td>
                <td className="py-2 text-right text-slate-700">
                  {formatMoney(line.actual_rate)}
                </td>
                <td className="py-2 text-right text-slate-700">
                  {formatMoney(line.discount)}
                </td>
                <td className="py-2 text-right font-medium text-slate-800">
                  {formatMoney(line.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm sm:w-80 sm:ml-auto">
          <dt className="text-slate-500">{t("billing.subtotal")}</dt>
          <dd className="text-right text-slate-800">
            {formatMoney(bill.subtotal)}
          </dd>
          <dt className="text-slate-500">{t("billing.billDiscount")}</dt>
          <dd className="text-right text-slate-800">
            {formatMoney(bill.discount)}
          </dd>
          <dt className="font-medium text-slate-700">
            {t("billing.grandTotal")}
          </dt>
          <dd className="text-right font-semibold text-slate-900">
            {formatMoney(bill.grand_total)}
          </dd>
          {isCustomerBill && (
            <>
              <dt className="text-slate-500">{t("billing.previousBalance")}</dt>
              <dd className="text-right text-slate-800">
                {formatMoney(bill.previous_balance)}
              </dd>
              <dt className="text-slate-500">{t("billing.paidNow")}</dt>
              <dd className="text-right text-slate-800">
                {formatMoney(bill.amount_paid)}
              </dd>
              <dt className="text-slate-500">
                {t("billing.currentBillBalance")}
              </dt>
              <dd className="text-right text-slate-800">
                {formatMoney(bill.current_bill_balance)}
              </dd>
              {Number(bill.amount_paid) > Number(bill.grand_total) && (
                <>
                  <dt className="text-slate-500">
                    {t("billing.partialBalancePaid")}
                  </dt>
                  <dd className="text-right font-medium text-success-700">
                    {formatMoney(
                      Number(bill.amount_paid) - Number(bill.grand_total)
                    )}
                  </dd>
                </>
              )}
              <dt className="font-medium text-slate-700">
                {t("billing.overallBalance")}
              </dt>
              <dd className="text-right text-base font-semibold text-accent-700">
                {formatMoney(bill.overall_balance)}
              </dd>
            </>
          )}
        </dl>

        {bill.notes && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">
            {bill.notes}
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("billing.cancelTitle")}
        description={t("billing.cancelDescription")}
        confirmLabel={t("common.confirm")}
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      >
        <Input
          label={t("billing.cancelReason")}
          placeholder={t("billing.cancelReasonPlaceholder")}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
