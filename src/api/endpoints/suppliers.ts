import { api } from "@/api/client";
import type { ApiEnvelope, Supplier, SupplierBalance } from "@/types";

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
