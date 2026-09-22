import { api } from "@/api/client";
import type { ApiEnvelope, Bill, BillStatus, BillType, PaymentMethod } from "@/types";

export interface BillItemInput {
  item_id: string;
  item_unit_id?: string;
  quantity: number;
  actual_rate?: number;
  discount?: number;
  /** One actual weight (kg) per container — only meaningful when the
   * chosen unit is weight-variable (see ItemUnit.is_weight_variable);
   * must have exactly `quantity` entries. */
  weights?: number[];
}

export interface CreateBillInput {
  bill_type: BillType;
  customer_id?: string;
  transaction_at?: string;
  discount?: number;
  amount_paid?: number;
  payment_method?: PaymentMethod;
  notes?: string;
  items: BillItemInput[];
}

export interface ListBillsParams {
  customer_id?: string;
  bill_status?: BillStatus;
  bill_type?: BillType;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export async function listBills(
  params?: ListBillsParams
): Promise<ApiEnvelope<Bill[]>> {
  const { data } = await api.get<ApiEnvelope<Bill[]>>("/bills", { params });
  return data;
}

export async function getBill(id: string): Promise<Bill> {
  const { data } = await api.get<ApiEnvelope<Bill>>(`/bills/${id}`);
  return data.data;
}

export async function getBillByNumber(billNumber: string): Promise<Bill> {
  const { data } = await api.get<ApiEnvelope<Bill>>(
    `/bills/number/${encodeURIComponent(billNumber)}`
  );
  return data.data;
}

export async function createBill(input: CreateBillInput): Promise<Bill> {
  const { data } = await api.post<ApiEnvelope<Bill>>("/bills", input);
  return data.data;
}

export async function cancelBill(
  id: string,
  reason?: string
): Promise<Bill> {
  const { data } = await api.patch<ApiEnvelope<Bill>>(
    `/bills/${id}/cancel`,
    reason ? { reason } : {}
  );
  return data.data;
}
