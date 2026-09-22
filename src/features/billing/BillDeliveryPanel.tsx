import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  assignDelivery,
  getDeliveryByBill,
  listDeliveryAgents,
  reassignDeliveryAgent,
} from "@/api/endpoints/deliveries";
import { queryKeys } from "@/api/queryKeys";
import { Button, useToast } from "@/components/ui";
import {
  AgentPicker,
  agentSelectionToPayload,
  EMPTY_AGENT_SELECTION,
  type AgentSelection,
} from "@/features/shared/AgentPicker";
import { useLanguage } from "@/contexts/LanguageContext";

/** Assign/change the delivery agent for a customer bill — from bill
 * creation (optional there) or any time afterward from here. Never
 * duplicates the delivery record: creates one only if the bill
 * doesn't have one yet, otherwise reassigns the existing one. */
export function BillDeliveryPanel({ billId }: { billId: string }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [agentSelection, setAgentSelection] = useState<AgentSelection>(EMPTY_AGENT_SELECTION);

  const { data: delivery, isLoading } = useQuery({
    queryKey: queryKeys.deliveries.byBill(billId),
    queryFn: () => getDeliveryByBill(billId),
  });

  const { data: agentsData } = useQuery({
    queryKey: queryKeys.deliveryAgents.list(),
    queryFn: () => listDeliveryAgents(),
    enabled: editing,
  });
  const agents = agentsData?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      const payload = agentSelectionToPayload(agentSelection);
      return delivery
        ? reassignDeliveryAgent(delivery.id, {
            delivery_agent_id: payload.delivery_agent_id ?? null,
            temp_agent_name: payload.temp_agent_name ?? null,
          })
        : assignDelivery({ bill_id: billId, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.byBill(billId) });
      toast({ variant: "success", title: t("billing.agentUpdateSuccess") });
      setEditing(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  if (isLoading) return null;

  const currentAgentLabel = delivery?.delivery_agents?.name ?? delivery?.temp_agent_name;

  return (
    <div className="print-hide flex items-center gap-3 rounded-control border border-slate-200 bg-white px-4 py-3 text-sm">
      <Truck className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <span className="text-slate-500">{t("billing.deliveryAgent")}:</span>
      {editing ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <AgentPicker agents={agents} value={agentSelection} onChange={setAgentSelection} />
          <Button size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
            {t("common.save")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      ) : (
        <>
          <span className="font-medium text-slate-800">
            {currentAgentLabel ?? t("billing.notAssigned")}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              setAgentSelection(
                delivery?.delivery_agent_id
                  ? { mode: "existing", agentId: delivery.delivery_agent_id, tempName: "" }
                  : delivery?.temp_agent_name
                    ? { mode: "temporary", agentId: "", tempName: delivery.temp_agent_name }
                    : EMPTY_AGENT_SELECTION
              );
              setEditing(true);
            }}
          >
            {currentAgentLabel ? t("billing.changeAgent") : t("billing.assignAgent")}
          </Button>
        </>
      )}
    </div>
  );
}
