import { api } from "@/api/client";
import type { ApiEnvelope, Item, ItemUnit } from "@/types";

export interface ItemInput {
  item_code: string;
  english_name: string;
  telugu_name?: string;
  category_id?: string;
  description?: string;
}

export interface ItemUnitInput {
  unit: string;
  standard_price: number;
  is_default?: boolean;
}

export async function listItems(params?: {
  search?: string;
  categoryId?: string;
  includeInactive?: boolean;
}): Promise<ApiEnvelope<Item[]>> {
  const { data } = await api.get<ApiEnvelope<Item[]>>("/items", {
    params: {
      search: params?.search || undefined,
      categoryId: params?.categoryId || undefined,
      includeInactive: params?.includeInactive ? "true" : undefined,
    },
  });
  return data;
}

export async function getItem(id: string): Promise<Item> {
  const { data } = await api.get<ApiEnvelope<Item>>(`/items/${id}`);
  return data.data;
}

export async function createItem(input: ItemInput): Promise<Item> {
  const { data } = await api.post<ApiEnvelope<Item>>("/items", input);
  return data.data;
}

export async function updateItem(
  id: string,
  input: Partial<ItemInput>
): Promise<Item> {
  const { data } = await api.patch<ApiEnvelope<Item>>(
    `/items/${id}`,
    input
  );
  return data.data;
}

export async function setItemActive(
  id: string,
  active: boolean
): Promise<void> {
  await api.patch(`/items/${id}/${active ? "activate" : "deactivate"}`);
}

export async function listItemUnits(
  itemId: string
): Promise<ApiEnvelope<ItemUnit[]>> {
  const { data } = await api.get<ApiEnvelope<ItemUnit[]>>(
    `/items/${itemId}/units`
  );
  return data;
}

export async function createItemUnit(
  itemId: string,
  input: ItemUnitInput
): Promise<ItemUnit> {
  const { data } = await api.post<ApiEnvelope<ItemUnit>>(
    `/items/${itemId}/units`,
    input
  );
  return data.data;
}

export async function updateItemUnit(
  itemId: string,
  unitId: string,
  input: Partial<ItemUnitInput> & { is_active?: boolean }
): Promise<ItemUnit> {
  const { data } = await api.patch<ApiEnvelope<ItemUnit>>(
    `/items/${itemId}/units/${unitId}`,
    input
  );
  return data.data;
}
