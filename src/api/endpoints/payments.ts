import { downloadFile } from "@/lib/download";
import type { ReportRange } from "@/api/endpoints/reports";
import { api } from "@/api/client";
import type { ApiEnvelope, Payment, PaymentMethod } from "@/types";

export interface PaymentAllocationInput {
  bill_id: string;
  amount: number;
}

export interface CreatePaymentInput {
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_at?: string;
  reference_number?: string;
  notes?: string;
  allocations?: PaymentAllocationInput[];
}

export interface ListPaymentsParams {
  range?: ReportRange;
  start_date?: string;
  end_date?: string;
  customer_id?: string;
  payment_method?: PaymentMethod;
  search?: string;
}

export async function listPayments(
  params?: ListPaymentsParams
): Promise<ApiEnvelope<Payment[]>> {
  const { data } = await api.get<ApiEnvelope<Payment[]>>("/payments", {
    params,
  });
  return data;
}

export async function getPayment(id: string): Promise<Payment> {
  const { data } = await api.get<ApiEnvelope<Payment>>(`/payments/${id}`);
  return data.data;
}

export async function getPaymentByNumber(
  paymentNumber: string
): Promise<Payment> {
  const { data } = await api.get<ApiEnvelope<Payment>>(
    `/payments/number/${encodeURIComponent(paymentNumber)}`
  );
  return data.data;
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const { data } = await api.post<ApiEnvelope<Payment>>(
    "/payments",
    input
  );
  return data.data;
}

export async function cancelPayment(
  id: string,
  reason?: string
): Promise<Payment> {
  const { data } = await api.patch<ApiEnvelope<Payment>>(
    `/payments/${id}/cancel`,
    reason ? { reason } : {}
  );
  return data.data;
}

export async function exportPayments(params?: ListPaymentsParams): Promise<void> {
  await downloadFile(
    "/payments/export",
    params as Record<string, string | undefined>,
    "payments.xlsx"
  );
}
