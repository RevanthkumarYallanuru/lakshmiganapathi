import type { Item, ItemUnit } from "@/types";

/** Draft state for one row while building a bill. Rate/quantity/
 * discount are kept as strings for controlled inputs; parse to number
 * only when computing a preview or submitting. */
export interface BillLineDraft {
  key: string;
  item: Item;
  units: ItemUnit[];
  unitId: string;
  standardRate: number;
  actualRate: string;
  quantity: string;
  discount: string;
}

/** Client-side preview only — the authoritative line_total is
 * recomputed and validated by the backend on submit. */
export function computeLineTotal(line: BillLineDraft): number {
  const qty = Number(line.quantity) || 0;
  const rate = Number(line.actualRate) || 0;
  const disc = Number(line.discount) || 0;
  return Math.max(0, qty * rate - disc);
}
