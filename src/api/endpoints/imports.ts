import { api } from "@/api/client";
import type { ApiEnvelope, Import } from "@/types";

export interface CreateImportInput {
  supplier_id: string;
  item_id: string;
  quantity: number;
  unit: string;
  amount: number;
  paid_amount: number;
  import_date?: string;
  notes?: string;
}

export interface ListImportsParams {
  supplier_id?: string;
}

export async function listImports(
  params?: ListImportsParams
): Promise<ApiEnvelope<Import[]>> {
  const { data } = await api.get<ApiEnvelope<Import[]>>("/imports", {
    params,
  });
  return data;
}

export async function getImport(id: string): Promise<Import> {
  const { data } = await api.get<ApiEnvelope<Import>>(`/imports/${id}`);
  return data.data;
}

export async function createImport(
  input: CreateImportInput
): Promise<Import> {
  const { data } = await api.post<ApiEnvelope<Import>>("/imports", input);
  return data.data;
}
