import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, IndianRupee, Pencil, Wallet } from "lucide-react";

import { ApiError } from "@/api/client";
import { getCustomer, updateCustomer } from "@/api/endpoints/customers";
import { createPayment, type CreatePaymentInput } from "@/api/endpoints/payments";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  useToast,
} from "@/components/ui";
import { CustomerFormDialog } from "@/features/customers/CustomerFormDialog";
import { OpeningBalanceDialog } from "@/features/customers/OpeningBalanceDialog";
import {
  PaymentFormDialog,
  type PaymentSubmitValues,
} from "@/features/payments/PaymentFormDialog";
import { CustomerBillsPanel } from "@/features/shared/CustomerBillsPanel";
import { CustomerLedgerPanel } from "@/features/shared/CustomerLedgerPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";

export function CustomerProfilePage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [openingBalanceOpen, setOpeningBalanceOpen] = useState(false);

  const {
    data: customer,
    isLoading: customerLoading,
    isError: customerError,
    refetch: refetchCustomer,
  } = useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (values: Parameters<typeof updateCustomer>[1]) =>
      updateCustomer(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
      toast({ variant: "success", title: t("customers.updateSuccess") });
      setEditOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (values: PaymentSubmitValues) =>
      createPayment(values as CreatePaymentInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.balance(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
      toast({ variant: "success", title: t("payments.createSuccess") });
      setPaymentOpen(false);
      setPaymentError(null);
    },
    onError: (error) => {
      setPaymentError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const localizedName = useLocalizedName(
    customer?.english_name ?? "",
    customer?.telugu_name
  );

  if (customerLoading) {
    return <LoadingState label={t("common.loading")} />;
  }

  if (customerError || !customer) {
    return <ErrorState onRetry={() => refetchCustomer()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="flex items-center gap-1.5 rounded-control bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("customers.back")}
        </button>
        <div className="flex gap-2">
          {hasRole("ADMIN") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpeningBalanceOpen(true)}
            >
              <Wallet className="h-3.5 w-3.5" aria-hidden />
              {t("customers.setOpeningBalance")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaymentError(null);
              setPaymentOpen(true);
            }}
          >
            <IndianRupee className="h-3.5 w-3.5" aria-hidden />
            {t("payments.makePayment")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("common.edit")}
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {localizedName}
            </h1>
            <p className="text-sm text-slate-500">{customer.customer_code}</p>
            {customer.phone && (
              <p className="text-sm text-slate-500">{customer.phone}</p>
            )}
            {customer.place && (
              <p className="text-sm text-slate-400">{customer.place}</p>
            )}
          </div>
          <Badge tone={customer.is_active ? "success" : "neutral"}>
            {customer.is_active ? t("common.active") : t("common.inactive")}
          </Badge>
        </div>
      </Card>

      <CustomerBillsPanel customerId={id} />

      <CustomerLedgerPanel customerId={id} />

      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onSubmit={(values) =>
          updateMutation.mutate({
            customer_code: values.customer_code,
            english_name: values.english_name,
            telugu_name: values.telugu_name || undefined,
            phone: values.phone || undefined,
            alternate_phone: values.alternate_phone || undefined,
            place: values.place || undefined,
            address: values.address || undefined,
            notes: values.notes || undefined,
          })
        }
        isSubmitting={updateMutation.isPending}
      />

      <PaymentFormDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        initialCustomer={customer}
        onSubmit={(values) => paymentMutation.mutate(values)}
        isSubmitting={paymentMutation.isPending}
        formError={paymentError}
      />

      {hasRole("ADMIN") && (
        <OpeningBalanceDialog
          open={openingBalanceOpen}
          onOpenChange={setOpeningBalanceOpen}
          customerId={id}
        />
      )}
    </div>
  );
}
