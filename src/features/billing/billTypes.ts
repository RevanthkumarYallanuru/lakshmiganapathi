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
  /** One entry per container (e.g. per bag), kept in sync with
   * `quantity` whenever the selected unit is weight-variable — see
   * `resizeWeights`. Unused (stays empty) for ordinary units. */
  weights: string[];
}

export function selectedUnit(line: BillLineDraft): ItemUnit | undefined {
  return line.units.find((u) => u.id === line.unitId);
}

export function isWeightVariable(line: BillLineDraft): boolean {
  return selectedUnit(line)?.is_weight_variable ?? false;
}

/** Grows/shrinks `weights` to match a new container count, preserving
 * already-entered values in their same bag slot rather than resetting
 * everything on every quantity keystroke. */
export function resizeWeights(weights: string[], containerCount: number): string[] {
  const count = Number.isFinite(containerCount) && containerCount > 0
    ? Math.floor(containerCount)
    : 0;
  if (count === weights.length) return weights;
  if (count < weights.length) return weights.slice(0, count);
  return [...weights, ...Array(count - weights.length).fill("")];
}

export function totalWeightKg(line: BillLineDraft): number {
  return line.weights.reduce((sum, w) => sum + (Number(w) || 0), 0);
}

/** Client-side preview only — the authoritative line_total is
 * recomputed and validated by the backend on submit. For a
 * weight-variable unit, the bill is charged on summed container
 * weight (kg) at the entered rate, not on the container count. */
export function computeLineTotal(line: BillLineDraft): number {
  const rate = Number(line.actualRate) || 0;
  const disc = Number(line.discount) || 0;
  const qty = isWeightVariable(line) ? totalWeightKg(line) : Number(line.quantity) || 0;
  return Math.max(0, qty * rate - disc);
}
