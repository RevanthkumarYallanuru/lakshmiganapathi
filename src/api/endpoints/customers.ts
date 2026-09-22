import { api } from "@/api/client";
import type { ApiEnvelope, Customer, Payment } from "@/types";

export interface CustomerInput {
  customer_code: string;
  english_name: string;
  telugu_name?: string;
  phone?: string;
  alternate_phone?: string;
  place?: string;
  address?: string;
  notes?: string;
}

export async function listCustomers(
  search?: string,
  activeOnly?: boolean
): Promise<ApiEnvelope<Customer[]>> {
  const { data } = await api.get<ApiEnvelope<Customer[]>>("/customers", {
    params: {
      search: search || undefined,
      activeOnly: activeOnly ? "true" : undefined,
    },
  });
  return data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<ApiEnvelope<Customer>>(`/customers/${id}`);
  return data.data;
}

export async function createCustomer(
  input: CustomerInput
): Promise<Customer> {
  const { data } = await api.post<ApiEnvelope<Customer>>(
    "/customers",
    input
  );
  return data.data;
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>
): Promise<Customer> {
  const { data } = await api.patch<ApiEnvelope<Customer>>(
    `/customers/${id}`,
    input
  );
  return data.data;
}

export async function setCustomerActive(
  id: string,
  active: boolean
): Promise<Customer> {
  const { data } = await api.patch<ApiEnvelope<Customer>>(
    `/customers/${id}/${active ? "activate" : "deactivate"}`
  );
  return data.data;
}

export async function getCustomerPayments(
  id: string
): Promise<ApiEnvelope<Payment[]>> {
  const { data } = await api.get<ApiEnvelope<Payment[]>>(
    `/customers/${id}/payments`
  );
  return data;
}
