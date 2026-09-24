import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, IndianRupee, Pencil, Plus } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  createSupplierBulkPayment,
  getSupplier,
  getSupplierBalance,
  updateSupplier,
  type SupplierBulkPaymentInput,
} from "@/api/endpoints/suppliers";
import {
  createPayable,
  recordPayablePayment,
  type CreatePayableInput,
} from "@/api/endpoints/payables";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  useToast,
} from "@/components/ui";
import { PayableFormDialog } from "@/features/payables/PayableFormDialog";
import { PayableDetailDialog } from "@/features/payables/PayableDetailDialog";
import {
  PayablePaymentDialog,
  type PayablePaymentSubmitValues,
} from "@/features/payables/PayablePaymentDialog";
import { SupplierBulkPaymentDialog } from "@/features/suppliers/SupplierBulkPaymentDialog";
import { SupplierFormDialog } from "@/features/suppliers/SupplierFormDialog";
import { SupplierImportsPanel } from "@/features/suppliers/SupplierImportsPanel";
import { SupplierPayablesPanel } from "@/features/suppliers/SupplierPayablesPanel";
import { SupplierPaymentsPanel } from "@/features/suppliers/SupplierPaymentsPanel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { formatMoney } from "@/lib/money";
import type { Payable } from "@/types";

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "success" | "danger";
}) {
  const toneClasses = {
    accent: "text-accent-700",
    success: "text-success-700",
    danger: "text-danger-600",
  } as const;

  return (
    <Card>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClasses[tone]}`}>{value}</p>
    </Card>
  );
}

export function SupplierProfilePage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [createPayOpen, setCreatePayOpen] = useState(false);
  const [createPayError, setCreatePayError] = useState<string | null>(null);
  const [bulkPaymentOpen, setBulkPaymentOpen] = useState(false);
  const [bulkPaymentError, setBulkPaymentError] = useState<string | null>(null);
  const [detailPayable, setDetailPayable] = useState<Payable | null>(null);
  const [paymentPayable, setPaymentPayable] = useState<Payable | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    data: supplier,
    isLoading: supplierLoading,
    isError: supplierError,
    refetch: refetchSupplier,
  } = useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: () => getSupplier(id),
    enabled: !!id,
  });

  const { data: balance } = useQuery({
    queryKey: queryKeys.suppliers.balance(id),
    queryFn: () => getSupplierBalance(id),
    enabled: !!id,
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.balance(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.balances() });
    queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.payments(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.payables.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.imports.all() });
  }

  const updateMutation = useMutation({
    mutationFn: (values: Parameters<typeof updateSupplier>[1]) =>
      updateSupplier(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      toast({ variant: "success", title: t("suppliers.updateSuccess") });
      setEditOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const createPayableMutation = useMutation({
    mutationFn: (values: CreatePayableInput) => createPayable(values),
    onSuccess: () => {
      invalidateAll();
      toast({ variant: "success", title: t("payables.createSuccess") });
      setCreatePayOpen(false);
      setCreatePayError(null);
    },
    onError: (error) => {
      setCreatePayError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (values: PayablePaymentSubmitValues) =>
      recordPayablePayment(paymentPayable!.id, values),
    onSuccess: () => {
      invalidateAll();
      toast({ variant: "success", title: t("payables.paymentSuccess") });
      setPaymentPayable(null);
      setPaymentError(null);
    },
    onError: (error) => {
      setPaymentError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const bulkPaymentMutation = useMutation({
    mutationFn: (values: SupplierBulkPaymentInput) =>
      createSupplierBulkPayment(id, values),
    onSuccess: () => {
      invalidateAll();
      toast({ variant: "success", title: t("payables.paymentSuccess") });
      setBulkPaymentOpen(false);
      setBulkPaymentError(null);
    },
    onError: (error) => {
      setBulkPaymentError(
        error instanceof ApiError ? error.message : t("common.errorGeneric")
      );
    },
  });

  const localizedName = useLocalizedName(
    supplier?.name ?? "",
    supplier?.telugu_name
  );

  const hasBalance = Number(balance?.balance ?? 0) > 0;

  function handleMakePaymentClick() {
    if (!hasBalance) return;
    setBulkPaymentError(null);
    setBulkPaymentOpen(true);
  }

  if (supplierLoading) {
    return <LoadingState label={t("common.loading")} />;
  }

  if (supplierError || !supplier) {
    return <ErrorState onRetry={() => refetchSupplier()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/suppliers")}
          className="flex items-center gap-1.5 rounded-control bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("suppliers.back")}
        </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCreatePayError(null);
              setCreatePayOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t("suppliers.newPay")}
          </Button>
          {hasBalance && (
            <Button variant="outline" size="sm" onClick={handleMakePaymentClick}>
              <IndianRupee className="h-3.5 w-3.5" aria-hidden />
              {t("payables.makePayment")}
            </Button>
          )}
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
            {supplier.organization && (
              <p className="text-sm text-slate-500">{supplier.organization}</p>
            )}
            {supplier.phone && (
              <p className="text-sm text-slate-500">{supplier.phone}</p>
            )}
            {supplier.address && (
              <p className="text-sm text-slate-400">{supplier.address}</p>
            )}
          </div>
          <Badge tone={supplier.is_active ? "success" : "neutral"}>
            {supplier.is_active ? t("common.active") : t("common.inactive")}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("suppliers.totalPayable")}
          value={formatMoney(balance?.total_payable ?? "0")}
          tone="accent"
        />
        <StatCard
          label={t("payables.totalPaid")}
          value={formatMoney(balance?.total_paid ?? "0")}
          tone="success"
        />
        <StatCard
          label={t("suppliers.balance")}
          value={formatMoney(balance?.balance ?? "0")}
          tone="danger"
        />
      </div>

      <SupplierPayablesPanel supplierId={id} onSelectPayable={setDetailPayable} />

      <SupplierImportsPanel supplierId={id} />

      <SupplierPaymentsPanel supplierId={id} />

      <SupplierFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        supplier={supplier}
        onSubmit={(values) =>
          updateMutation.mutate({
            name: values.name,
            telugu_name: values.telugu_name || undefined,
            phone: values.phone || undefined,
            alternate_phone: values.alternate_phone || undefined,
            organization: values.organization || undefined,
            address: values.address || undefined,
            notes: values.notes || undefined,
          })
        }
        isSubmitting={updateMutation.isPending}
      />

      <PayableFormDialog
        open={createPayOpen}
        onOpenChange={(open) => {
          setCreatePayOpen(open);
          if (!open) setCreatePayError(null);
        }}
        initialSupplier={supplier}
        onSubmit={(values) => createPayableMutation.mutate(values)}
        isSubmitting={createPayableMutation.isPending}
        formError={createPayError}
      />

      <PayableDetailDialog
        open={!!detailPayable}
        payable={detailPayable}
        onOpenChange={(open) => {
          if (!open) setDetailPayable(null);
        }}
        onMakePayment={() => {
          if (!detailPayable) return;
          const target = detailPayable;
          setDetailPayable(null);
          setPaymentError(null);
          setPaymentPayable(target);
        }}
      />

      <SupplierBulkPaymentDialog
        open={bulkPaymentOpen}
        supplier={supplier}
        balance={balance?.balance ?? "0"}
        onOpenChange={(open) => {
          setBulkPaymentOpen(open);
          if (!open) setBulkPaymentError(null);
        }}
        onSubmit={(values) => bulkPaymentMutation.mutate(values)}
        isSubmitting={bulkPaymentMutation.isPending}
        formError={bulkPaymentError}
      />

      <PayablePaymentDialog
        open={!!paymentPayable}
        payable={paymentPayable}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentPayable(null);
            setPaymentError(null);
          }
        }}
        onSubmit={(values) => paymentMutation.mutate(values)}
        isSubmitting={paymentMutation.isPending}
        formError={paymentError}
      />
    </div>
  );
}
