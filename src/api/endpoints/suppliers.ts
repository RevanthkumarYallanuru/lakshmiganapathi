import { api } from "@/api/client";
import type { ReportRange } from "@/api/endpoints/reports";
import { downloadFile } from "@/lib/download";
import type {
  ApiEnvelope,
  Supplier,
  SupplierBalance,
  SupplierPayment,
} from "@/types";

export interface SupplierInput {
  name: string;
  telugu_name?: string;
  phone?: string;
  alternate_phone?: string;
  organization?: string;
  address?: string;
  notes?: string;
  /** Create-only — see supplier.service.ts's createSupplier, which
   * turns this into an ordinary opening-balance payable. */
  initial_balance?: number;
}

export async function listSuppliers(
  search?: string,
  activeOnly?: boolean
): Promise<ApiEnvelope<Supplier[]>> {
  const { data } = await api.get<ApiEnvelope<Supplier[]>>("/suppliers", {
    params: {
      search: search || undefined,
      activeOnly: activeOnly ? "true" : undefined,
    },
  });
  return data;
}

export async function getSupplier(id: string): Promise<Supplier> {
  const { data } = await api.get<ApiEnvelope<Supplier>>(`/suppliers/${id}`);
  return data.data;
}

export async function getSupplierBalances(): Promise<
  ApiEnvelope<SupplierBalance[]>
> {
  const { data } = await api.get<ApiEnvelope<SupplierBalance[]>>(
    "/suppliers/balances"
  );
  return data;
}

export async function getSupplierBalance(
  id: string
): Promise<SupplierBalance> {
  const { data } = await api.get<ApiEnvelope<SupplierBalance>>(
    `/suppliers/${id}/balance`
  );
  return data.data;
}

export async function createSupplier(
  input: SupplierInput
): Promise<Supplier> {
  const { data } = await api.post<ApiEnvelope<Supplier>>(
    "/suppliers",
    input
  );
  return data.data;
}

export async function updateSupplier(
  id: string,
  input: Partial<Omit<SupplierInput, "initial_balance">>
): Promise<Supplier> {
  const { data } = await api.patch<ApiEnvelope<Supplier>>(
    `/suppliers/${id}`,
    input
  );
  return data.data;
}

export async function setSupplierActive(
  id: string,
  active: boolean
): Promise<Supplier> {
  const { data } = await api.patch<ApiEnvelope<Supplier>>(
    `/suppliers/${id}/${active ? "activate" : "deactivate"}`
  );
  return data.data;
}

export interface SupplierBulkPaymentInput {
  amount: number;
  payment_date?: string;
}

export interface SupplierPaymentsParams {
  range?: ReportRange;
  start_date?: string;
  end_date?: string;
}

export async function listSupplierPayments(
  id: string,
  params?: SupplierPaymentsParams
): Promise<ApiEnvelope<SupplierPayment[]>> {
  const { data } = await api.get<ApiEnvelope<SupplierPayment[]>>(
    `/suppliers/${id}/payments`,
    { params }
  );
  return data;
}

export async function exportSupplierPayments(
  id: string,
  params?: SupplierPaymentsParams
): Promise<void> {
  await downloadFile(
    `/suppliers/${id}/payments/export`,
    params as Record<string, string | undefined>,
    "supplier-payments.xlsx"
  );
}

export async function createSupplierBulkPayment(
  id: string,
  input: SupplierBulkPaymentInput
): Promise<SupplierPayment> {
  const { data } = await api.post<ApiEnvelope<SupplierPayment>>(
    `/suppliers/${id}/payments`,
    input
  );
  return data.data;
}
