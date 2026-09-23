import { api } from "@/api/client";
import type { RangeParams } from "@/api/endpoints/reports";
import type {
  ApiEnvelope,
  Payable,
  PayablesInsights,
  PayableStatus,
  PaymentMethod,
} from "@/types";

export interface CreatePayableInput {
  payee_name: string;
  total_amount: number;
  reason: string;
}

export interface RecordPayablePaymentInput {
  amount: number;
  payment_date?: string;
  payment_method?: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

export interface ListPayablesParams {
  status?: PayableStatus;
  search?: string;
}

export async function listPayables(
  params?: ListPayablesParams
): Promise<ApiEnvelope<Payable[]>> {
  const { data } = await api.get<ApiEnvelope<Payable[]>>("/payables", {
    params,
  });
  return data;
}

export async function getPayable(id: string): Promise<Payable> {
  const { data } = await api.get<ApiEnvelope<Payable>>(`/payables/${id}`);
  return data.data;
}

export async function createPayable(
  input: CreatePayableInput
): Promise<Payable> {
  const { data } = await api.post<ApiEnvelope<Payable>>("/payables", input);
  return data.data;
}

export async function recordPayablePayment(
  id: string,
  input: RecordPayablePaymentInput
): Promise<Payable> {
  const { data } = await api.post<ApiEnvelope<Payable>>(
    `/payables/${id}/payments`,
    input
  );
  return data.data;
}

export async function getPayablesInsights(
  params: RangeParams
): Promise<PayablesInsights> {
  const { data } = await api.get<ApiEnvelope<PayablesInsights>>(
    "/payables/insights",
    { params }
  );
  return data.data;
}
