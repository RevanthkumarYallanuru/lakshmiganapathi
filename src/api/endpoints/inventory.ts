import { downloadFile } from "@/lib/download";
import { api } from "@/api/client";
import type {
  ApiEnvelope,
  StockMovement,
  StockTallyRow,
} from "@/types";

export async function getStockTally(): Promise<ApiEnvelope<StockTallyRow[]>> {
  const { data } = await api.get<ApiEnvelope<StockTallyRow[]>>(
    "/inventory/tally"
  );
  return data;
}

/** Manual stock correction — see inventory.service.ts's setItemStock
 * doc comment: `quantity` is the correct current quantity, not a
 * +/- delta. */
export async function setItemStock(
  itemId: string,
  payload: { quantity: number; notes?: string }
): Promise<ApiEnvelope<StockMovement>> {
  const { data } = await api.post<ApiEnvelope<StockMovement>>(
    `/inventory/items/${itemId}/stock`,
    payload
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

export async function exportStockTally(): Promise<void> {
  await downloadFile("/inventory/tally/export", undefined, "stock-tally.xlsx");
}
