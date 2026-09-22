import { Select } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DeliveryAgent } from "@/types";

/** One agent assignment for a bill/delivery — at most one of
 * agentId/tempName is ever populated, driven by `mode`. Mirrors the
 * backend's mutual exclusion (delivery_agent_id vs temp_agent_name). */
export interface AgentSelection {
  mode: "existing" | "temporary";
  agentId: string;
  tempName: string;
}

export const EMPTY_AGENT_SELECTION: AgentSelection = {
  mode: "existing",
  agentId: "",
  tempName: "",
};

/** Resolves a selection into the two mutually-exclusive API fields —
 * used by callers building the bill/delivery request payload. */
export function agentSelectionToPayload(selection: AgentSelection): {
  delivery_agent_id?: string;
  temp_agent_name?: string;
} {
  if (selection.mode === "existing") {
    return { delivery_agent_id: selection.agentId || undefined };
  }
  const trimmed = selection.tempName.trim();
  return { temp_agent_name: trimmed || undefined };
}

/** Lets an admin assign either a permanent agent from the existing
 * Agents list, or a free-text one-off name (e.g. "Raju - Auto") that
 * is never saved to that list — used during billing and when
 * changing a bill's assigned agent afterward. Leaving both empty
 * means no agent. */
export function AgentPicker({
  agents,
  value,
  onChange,
  label,
}: {
  agents: DeliveryAgent[];
  value: AgentSelection;
  onChange: (value: AgentSelection) => void;
  label?: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      {value.mode === "existing" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={value.agentId}
            onValueChange={(agentId) => onChange({ ...value, agentId })}
            placeholder={t("billing.notAssigned")}
            options={agents.map((agent) => ({ value: agent.id, label: agent.name }))}
          />
          <button
            type="button"
            onClick={() => onChange({ ...value, mode: "temporary" })}
            className="text-xs font-medium text-accent-600 hover:underline"
          >
            {t("billing.enterAgentName")}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={value.tempName}
            onChange={(event) => onChange({ ...value, tempName: event.target.value })}
            placeholder={t("billing.agentNamePlaceholder")}
            className="h-10 rounded-control border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1"
          />
          <button
            type="button"
            onClick={() => onChange({ ...value, mode: "existing", tempName: "" })}
            className="text-xs font-medium text-accent-600 hover:underline"
          >
            {t("billing.selectFromExisting")}
          </button>
        </div>
      )}
    </div>
  );
}
