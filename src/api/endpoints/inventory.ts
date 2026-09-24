import { api } from "@/api/client";
import type { ApiEnvelope, StockMovement, StockTallyRow } from "@/types";

export async function getStockTally(): Promise<ApiEnvelope<StockTallyRow[]>> {
  const { data } = await api.get<ApiEnvelope<StockTallyRow[]>>(
    "/inventory/tally"
  );
  return data;
}

export async function getItemStockMovements(
  itemId: string
): Promise<ApiEnvelope<StockMovement[]>> {
  const { data } = await api.get<ApiEnvelope<StockMovement[]>>(
    `/inventory/items/${itemId}/movements`
  );
  return data;
}
