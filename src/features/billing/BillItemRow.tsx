import { useState } from "react";
import { Languages, Trash2 } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { formatMoney } from "@/lib/money";
import type { BillLineDraft } from "@/features/billing/billTypes";
import {
  computeLineTotal,
  isWeightVariable,
  resizeWeights,
  totalWeightKg,
} from "@/features/billing/billTypes";

export function BillItemRow({
  line,
  onChange,
  onRemove,
}: {
  line: BillLineDraft;
  onChange: (patch: Partial<BillLineDraft>) => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const [nameOverride, setNameOverride] = useState<"en" | "te" | null>(null);
  const defaultName = useLocalizedName(line.item.english_name, line.item.telugu_name);
  const hasTelugu = !!line.item.telugu_name?.trim();
  const name =
    nameOverride === "te" && line.item.telugu_name
      ? line.item.telugu_name
      : nameOverride === "en"
        ? line.item.english_name
        : defaultName;
  const total = computeLineTotal(line);
  const isCustomRate = Number(line.actualRate) !== line.standardRate;
  const weightVariable = isWeightVariable(line);

  function handleUnitChange(unitId: string) {
    const unit = line.units.find((u) => u.id === unitId);
    if (!unit) return;
    onChange({
      unitId,
      standardRate: Number(unit.standard_price),
      actualRate: unit.standard_price,
      weights: unit.is_weight_variable
        ? resizeWeights(line.weights, Number(line.quantity) || 0)
        : [],
    });
  }

  function handleQuantityChange(value: string) {
    onChange({
      quantity: value,
      weights: weightVariable ? resizeWeights(line.weights, Number(value) || 0) : line.weights,
    });
  }

  function handleWeightChange(index: number, value: string) {
    const next = [...line.weights];
    next[index] = value;
    onChange({ weights: next });
  }

  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-12 sm:items-start sm:gap-3">
        <div className="col-span-2 flex items-start justify-between gap-1 sm:col-span-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{name}</p>
            <p className="text-xs text-slate-400">{line.item.item_code}</p>
          </div>
          {hasTelugu && (
            <button
              type="button"
              onClick={() =>
                setNameOverride((prev) => (prev === "te" ? "en" : "te"))
              }
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title={t("picker.toggleNameLanguage")}
              aria-label={t("picker.toggleNameLanguage")}
            >
              <Languages className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>

        <select
          value={line.unitId}
          onChange={(event) => handleUnitChange(event.target.value)}
          className="h-9 rounded-control border border-slate-300 bg-white px-2 text-sm sm:col-span-2"
          aria-label={t("billing.unit")}
        >
          {line.units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.unit}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          step={weightVariable ? "1" : "0.001"}
          value={line.quantity}
          onChange={(event) => handleQuantityChange(event.target.value)}
          placeholder={t("billing.quantity")}
          aria-label={t("billing.quantity")}
          className="h-9 rounded-control border border-slate-300 bg-white px-2 text-sm sm:col-span-2"
        />

        <div className="sm:col-span-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={line.actualRate}
            onChange={(event) => onChange({ actualRate: event.target.value })}
            placeholder={
              weightVariable ? t("items.ratePerKg") : t("billing.actualRate")
            }
            aria-label={t("billing.actualRate")}
            className="h-9 w-full rounded-control border border-slate-300 bg-white px-2 text-sm"
          />
          {isCustomRate && (
            <p className="mt-1 text-[11px] leading-tight text-warning-700">
              {t("billing.customRateNotice")} ({formatMoney(line.standardRate)})
            </p>
          )}
        </div>

        <input
          type="number"
          min="0"
          step="0.01"
          value={line.discount}
          onChange={(event) => onChange({ discount: event.target.value })}
          placeholder={t("billing.lineDiscount")}
          aria-label={t("billing.lineDiscount")}
          className="h-9 rounded-control border border-slate-300 bg-white px-2 text-sm sm:col-span-1"
        />

        <div className="flex items-center justify-between sm:col-span-1 sm:justify-end">
          <span className="text-sm font-medium text-slate-800 sm:hidden">
            {t("billing.lineTotal")}:
          </span>
          <span className="text-sm font-semibold text-slate-800">
            {formatMoney(total)}
          </span>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 items-center justify-center rounded-control text-slate-400 hover:bg-danger-50 hover:text-danger-600 sm:col-span-1"
          aria-label={t("billing.remove")}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {weightVariable && line.weights.length > 0 && (
        <div className="mt-2 rounded-control bg-slate-50 p-3 sm:ml-[calc(25%+0.75rem)]">
          <p className="mb-2 text-xs text-slate-500">{t("billing.weightEntryHint")}</p>
          <div className="flex flex-wrap gap-2">
            {line.weights.map((weight, index) => (
              <label key={index} className="flex items-center gap-1.5 text-sm">
                <span className="text-slate-500">
                  {line.units.find((u) => u.id === line.unitId)?.unit} {index + 1}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={weight}
                  onChange={(event) => handleWeightChange(index, event.target.value)}
                  className="h-8 w-20 rounded-control border border-slate-300 bg-white px-2 text-sm"
                />
                <span className="text-xs text-slate-400">
                  {t("billing.weightEntryLabel")}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {t("billing.totalWeight")}: {totalWeightKg(line).toFixed(3)} kg
          </p>
        </div>
      )}
    </div>
  );
}
