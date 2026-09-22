import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  createDeliveryAgent,
  listDeliveryAgents,
  setDeliveryAgentActive,
  updateDeliveryAgent,
  type DeliveryAgentInput,
} from "@/api/endpoints/deliveries";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  ConfirmDialog,
  SearchInput,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { DeliveryAgentFormDialog } from "@/features/delivery/DeliveryAgentFormDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DeliveryAgent } from "@/types";

export function DeliveryAgentsPanel() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryAgent | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    agent: DeliveryAgent;
    nextActive: boolean;
  } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.deliveryAgents.list(debouncedSearch),
    queryFn: () => listDeliveryAgents(debouncedSearch || undefined),
  });

  const agents = data?.data ?? [];

  function invalidate() {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.deliveryAgents.all(),
    });
  }

  const createMutation = useMutation({
    mutationFn: (values: DeliveryAgentInput) => createDeliveryAgent(values),
    onSuccess: () => {
      invalidate();
      toast({ variant: "success", title: t("delivery.createAgentSuccess") });
      setFormOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<DeliveryAgentInput> }) =>
      updateDeliveryAgent(id, values),
    onSuccess: () => {
      invalidate();
      toast({ variant: "success", title: t("delivery.updateAgentSuccess") });
      setFormOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setDeliveryAgentActive(id, active),
    onSuccess: () => {
      invalidate();
      setStatusTarget(null);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(agent: DeliveryAgent) {
    setEditing(agent);
    setFormOpen(true);
  }

  function handleSubmit(values: DeliveryAgentInput) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns: TableColumn<DeliveryAgent>[] = [
    {
      key: "name",
      header: t("delivery.agentName"),
      render: (agent) => (
        <div>
          <p className="font-medium text-slate-800">{agent.name}</p>
          {agent.vehicle_number && (
            <p className="text-xs text-slate-400">{agent.vehicle_number}</p>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: t("delivery.agentPhone"),
      render: (agent) => agent.phone ?? "—",
    },
    {
      key: "status",
      header: t("common.status"),
      render: (agent) => (
        <Badge tone={agent.is_active ? "success" : "neutral"}>
          {agent.is_active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (agent) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-warning-700 hover:bg-warning-50"
            onClick={() => openEdit(agent)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              agent.is_active
                ? "text-danger-600 hover:bg-danger-50"
                : "text-success-700 hover:bg-success-50"
            }
            onClick={() =>
              setStatusTarget({ agent, nextActive: !agent.is_active })
            }
          >
            {agent.is_active ? t("common.deactivate") : t("common.activate")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("delivery.agentSearchPlaceholder")}
          className="max-w-sm flex-1"
        />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("delivery.newAgent")}
        </Button>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={agents}
          keyExtractor={(agent) => agent.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("delivery.noAgents")}
          emptyDescription={t("delivery.noAgentsHint")}
        />
      </div>

      <DeliveryAgentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        agent={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {statusTarget && (
        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={
            statusTarget.nextActive
              ? t("delivery.activateAgentTitle")
              : t("delivery.deactivateAgentTitle")
          }
          description={
            statusTarget.nextActive ? "" : t("delivery.deactivateAgentDescription")
          }
          destructive={!statusTarget.nextActive}
          confirmLabel={
            statusTarget.nextActive ? t("common.activate") : t("common.deactivate")
          }
          loading={statusMutation.isPending}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.agent.id,
              active: statusTarget.nextActive,
            })
          }
        />
      )}
    </div>
  );
}
