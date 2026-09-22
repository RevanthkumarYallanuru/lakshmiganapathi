import { api } from "@/api/client";
import type { ApiEnvelope, Category } from "@/types";

export interface CategoryInput {
  name: string;
  telugu_name?: string;
}

export async function listCategories(
  search?: string
): Promise<ApiEnvelope<Category[]>> {
  const { data } = await api.get<ApiEnvelope<Category[]>>("/categories", {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await api.get<ApiEnvelope<Category>>(`/categories/${id}`);
  return data.data;
}

export async function createCategory(
  input: CategoryInput
): Promise<Category> {
  const { data } = await api.post<ApiEnvelope<Category>>(
    "/categories",
    input
  );
  return data.data;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<Category> {
  const { data } = await api.patch<ApiEnvelope<Category>>(
    `/categories/${id}`,
    input
  );
  return data.data;
}

export async function setCategoryActive(
  id: string,
  active: boolean
): Promise<Category> {
  const { data } = await api.patch<ApiEnvelope<Category>>(
    `/categories/${id}/${active ? "activate" : "deactivate"}`
  );
  return data.data;
}
