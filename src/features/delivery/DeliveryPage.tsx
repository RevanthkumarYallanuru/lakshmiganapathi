import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck } from "lucide-react";

import { ApiError } from "@/api/client";
import {
  exportDeliveries,
  listDeliveries,
  listDeliveryAgents,
  reassignDeliveryAgent,
  updateDeliveryStatus,
  type ListDeliveriesParams,
} from "@/api/endpoints/deliveries";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  ConfirmDialog,
  DateRangeFilter,
  Dialog,
  ExportButton,
  Pagination,
  SearchInput,
  Select,
  Table,
  useDateRangeFilter,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { DeliveryAgentsPanel } from "@/features/delivery/DeliveryAgentsPanel";
import {
  AgentPicker,
  agentSelectionToPayload,
  EMPTY_AGENT_SELECTION,
  type AgentSelection,
} from "@/features/shared/AgentPicker";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n";
import { formatDate, formatMoney } from "@/lib/money";
import type { Delivery, DeliveryStatus } from "@/types";

const STATUS_TONE: Record<DeliveryStatus, "neutral" | "accent" | "warning" | "danger" | "success"> = {
  GENERATED: "neutral",
  SENT: "accent",
  REACHED: "warning",
  BALANCE: "danger",
  CLEARED: "success",
};

const STATUS_LABEL_KEY: Record<DeliveryStatus, TranslationKey> = {
  GENERATED: "delivery.statusGenerated",
  SENT: "delivery.statusSent",
  REACHED: "delivery.statusReached",
  BALANCE: "delivery.statusBalance",
  CLEARED: "delivery.statusCleared",
};

const NEXT_STATUSES: Record<DeliveryStatus, { status: Exclude<DeliveryStatus, "GENERATED">; labelKey: TranslationKey }[]> = {
  GENERATED: [{ status: "SENT", labelKey: "delivery.markSent" }],
  SENT: [
    { status: "REACHED", labelKey: "delivery.markReached" },
    { status: "BALANCE", labelKey: "delivery.markBalance" },
    { status: "CLEARED", labelKey: "delivery.markCleared" },
  ],
  REACHED: [
    { status: "BALANCE", labelKey: "delivery.markBalance" },
    { status: "CLEARED", labelKey: "delivery.markCleared" },
  ],
  BALANCE: [{ status: "CLEARED", labelKey: "delivery.markCleared" }],
  CLEARED: [],
};

function ReassignDialog({
  delivery,
  onOpenChange,
}: {
  delivery: Delivery | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [agentSelection, setAgentSelection] = useState<AgentSelection>(
    delivery?.delivery_agent_id
      ? { mode: "existing", agentId: delivery.delivery_agent_id, tempName: "" }
      : delivery?.temp_agent_name
        ? { mode: "temporary", agentId: "", tempName: delivery.temp_agent_name }
        : EMPTY_AGENT_SELECTION
  );

  const { data: agentsData } = useQuery({
    queryKey: queryKeys.deliveryAgents.list(),
    queryFn: () => listDeliveryAgents(),
    enabled: !!delivery,
  });
  const agents = agentsData?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      const payload = agentSelectionToPayload(agentSelection);
      return reassignDeliveryAgent(delivery!.id, {
        delivery_agent_id: payload.delivery_agent_id ?? null,
        temp_agent_name: payload.temp_agent_name ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
      toast({ variant: "success", title: t("delivery.reassignSuccess") });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  if (!delivery) return null;

  return (
    <Dialog
      open={!!delivery}
      onOpenChange={onOpenChange}
      title={t("delivery.reassignAgent")}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <AgentPicker
          label={t("delivery.agent")}
          agents={agents}
          value={agentSelection}
          onChange={setAgentSelection}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function DeliveryPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"deliveries" | "agents">("deliveries");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [agentFilter, setAgentFilter] = useState("");
  const dateFilter = useDateRangeFilter("all");

  const [statusTarget, setStatusTarget] = useState<{
    delivery: Delivery;
    next: Exclude<DeliveryStatus, "GENERATED">;
    labelKey: TranslationKey;
  } | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Delivery | null>(null);

  const { data: agentsData } = useQuery({
    queryKey: queryKeys.deliveryAgents.list(),
    queryFn: () => listDeliveryAgents(),
  });
  const agents = agentsData?.data ?? [];

  const params: ListDeliveriesParams = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    delivery_agent_id: agentFilter || undefined,
    ...dateFilter.params,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.deliveries.list(params),
    queryFn: () => listDeliveries(params),
    placeholderData: keepPreviousData,
    enabled: tab === "deliveries" && dateFilter.ready,
  });

  const deliveries = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(deliveries);

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: Exclude<DeliveryStatus, "GENERATED"> }) =>
      updateDeliveryStatus(id, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
      toast({ variant: "success", title: t("delivery.statusUpdateSuccess") });
      setStatusTarget(null);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("common.errorGeneric"),
      });
    },
  });

  const columns: TableColumn<Delivery>[] = [
    {
      key: "bill",
      header: t("delivery.bill"),
      render: (delivery) => (
        <div>
          <p className="font-medium text-slate-800">
            {delivery.bills?.bill_number}
          </p>
          <p className="text-xs text-slate-400">
            {delivery.bills?.customer_name_snapshot ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: t("delivery.amount"),
      render: (delivery) =>
        delivery.bills ? formatMoney(delivery.bills.grand_total) : "—",
    },
    {
      key: "agent",
      header: t("delivery.agent"),
      render: (delivery) =>
        delivery.delivery_agents?.name ?? delivery.temp_agent_name ?? t("delivery.unassigned"),
    },
    {
      key: "status",
      header: t("delivery.status"),
      render: (delivery) => (
        <Badge tone={STATUS_TONE[delivery.status]}>
          {t(STATUS_LABEL_KEY[delivery.status])}
        </Badge>
      ),
    },
    {
      key: "date",
      header: t("common.date"),
      render: (delivery) => formatDate(delivery.created_at, true),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (delivery) => (
        <div className="flex flex-wrap justify-end gap-2">
          {NEXT_STATUSES[delivery.status].map((next) => (
            <Button
              key={next.status}
              variant="ghost"
              size="sm"
              className="text-accent-700 hover:bg-accent-50"
              onClick={() =>
                setStatusTarget({ delivery, next: next.status, labelKey: next.labelKey })
              }
            >
              {t(next.labelKey)}
            </Button>
          ))}
          {delivery.status !== "CLEARED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReassignTarget(delivery)}
            >
              {t("delivery.reassign")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Truck className="h-5 w-5 text-slate-400" aria-hidden />
          {t("delivery.title")}
        </h1>
        <div className="inline-flex rounded-control border border-slate-200 bg-slate-50 p-0.5 text-sm" role="group">
          {(["deliveries", "agents"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                tab === value
                  ? "bg-white text-accent-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {value === "deliveries" ? t("delivery.deliveries") : t("delivery.agents")}
            </button>
          ))}
        </div>
      </div>

      {tab === "agents" ? (
        <DeliveryAgentsPanel />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("delivery.searchPlaceholder")}
              className="max-w-sm flex-1"
            />
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as DeliveryStatus)}
              placeholder={t("delivery.allStatuses")}
              options={(Object.keys(STATUS_LABEL_KEY) as DeliveryStatus[]).map((value) => ({
                value,
                label: t(STATUS_LABEL_KEY[value]),
              }))}
            />
            <Select
              value={agentFilter}
              onValueChange={setAgentFilter}
              placeholder={t("delivery.allAgents")}
              options={agents.map((agent) => ({ value: agent.id, label: agent.name }))}
            />
            <DateRangeFilter filter={dateFilter} />
            <ExportButton
              onExport={() => exportDeliveries(params)}
              disabled={!dateFilter.ready}
            />
          </div>

          <div className="rounded-card border border-slate-200 bg-white p-2">
            <Table
              columns={columns}
              data={pageItems}
              keyExtractor={(delivery) => delivery.id}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
              loadingLabel={t("common.loading")}
              emptyTitle={t("delivery.noDeliveries")}
              emptyDescription={t("delivery.noDeliveriesHint")}
            />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {statusTarget && (
        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={t("delivery.updateStatusTitle")}
          description={t("delivery.updateStatusDescription")}
          destructive={false}
          confirmLabel={t(statusTarget.labelKey)}
          loading={statusMutation.isPending}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.delivery.id,
              next: statusTarget.next,
            })
          }
        />
      )}

      <ReassignDialog
        delivery={reassignTarget}
        onOpenChange={(open) => !open && setReassignTarget(null)}
      />
    </div>
  );
}
