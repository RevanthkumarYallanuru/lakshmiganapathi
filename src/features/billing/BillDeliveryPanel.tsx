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
import { Button, Select, useToast } from "@/components/ui";
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
  const [agentId, setAgentId] = useState("");

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
    mutationFn: () =>
      delivery
        ? reassignDeliveryAgent(delivery.id, agentId || null)
        : assignDelivery({ bill_id: billId, delivery_agent_id: agentId || undefined }),
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

  return (
    <div className="print-hide flex items-center gap-3 rounded-control border border-slate-200 bg-white px-4 py-3 text-sm">
      <Truck className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <span className="text-slate-500">{t("billing.deliveryAgent")}:</span>
      {editing ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select
            value={agentId}
            onValueChange={setAgentId}
            placeholder={t("billing.notAssigned")}
            options={agents.map((agent) => ({ value: agent.id, label: agent.name }))}
          />
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
            {delivery?.delivery_agents?.name ?? t("billing.notAssigned")}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              setAgentId(delivery?.delivery_agent_id ?? "");
              setEditing(true);
            }}
          >
            {delivery?.delivery_agents ? t("billing.changeAgent") : t("billing.assignAgent")}
          </Button>
        </>
      )}
    </div>
  );
}
