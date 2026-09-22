import { api } from "@/api/client";
import type {
  ApiEnvelope,
  Delivery,
  DeliveryAgent,
  DeliveryStatus,
} from "@/types";

export interface DeliveryAgentInput {
  name: string;
  phone?: string;
  vehicle_number?: string;
  notes?: string;
}

export async function listDeliveryAgents(
  search?: string
): Promise<ApiEnvelope<DeliveryAgent[]>> {
  const { data } = await api.get<ApiEnvelope<DeliveryAgent[]>>(
    "/delivery-agents",
    { params: search ? { search } : undefined }
  );
  return data;
}

export async function createDeliveryAgent(
  input: DeliveryAgentInput
): Promise<DeliveryAgent> {
  const { data } = await api.post<ApiEnvelope<DeliveryAgent>>(
    "/delivery-agents",
    input
  );
  return data.data;
}

export async function updateDeliveryAgent(
  id: string,
  input: Partial<DeliveryAgentInput>
): Promise<DeliveryAgent> {
  const { data } = await api.patch<ApiEnvelope<DeliveryAgent>>(
    `/delivery-agents/${id}`,
    input
  );
  return data.data;
}

export async function setDeliveryAgentActive(
  id: string,
  active: boolean
): Promise<DeliveryAgent> {
  const { data } = await api.patch<ApiEnvelope<DeliveryAgent>>(
    `/delivery-agents/${id}/${active ? "activate" : "deactivate"}`
  );
  return data.data;
}

export interface ListDeliveriesParams {
  status?: DeliveryStatus;
  delivery_agent_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export async function listDeliveries(
  params?: ListDeliveriesParams
): Promise<ApiEnvelope<Delivery[]>> {
  const { data } = await api.get<ApiEnvelope<Delivery[]>>("/deliveries", {
    params,
  });
  return data;
}

export async function getDelivery(id: string): Promise<Delivery> {
  const { data } = await api.get<ApiEnvelope<Delivery>>(
    `/deliveries/${id}`
  );
  return data.data;
}

export async function getDeliveryByBill(
  billId: string
): Promise<Delivery | null> {
  try {
    const { data } = await api.get<ApiEnvelope<Delivery>>(
      `/deliveries/bill/${billId}`
    );
    return data.data;
  } catch {
    return null;
  }
}

export async function assignDelivery(input: {
  bill_id: string;
  delivery_agent_id?: string;
  temp_agent_name?: string;
  notes?: string;
}): Promise<Delivery> {
  const { data } = await api.post<ApiEnvelope<Delivery>>(
    "/deliveries",
    input
  );
  return data.data;
}

export async function reassignDeliveryAgent(
  id: string,
  agent: { delivery_agent_id?: string | null; temp_agent_name?: string | null }
): Promise<Delivery> {
  const { data } = await api.patch<ApiEnvelope<Delivery>>(
    `/deliveries/${id}/agent`,
    agent
  );
  return data.data;
}

export async function updateDeliveryStatus(
  id: string,
  status: Exclude<DeliveryStatus, "GENERATED">,
  notes?: string
): Promise<Delivery> {
  const { data } = await api.patch<ApiEnvelope<Delivery>>(
    `/deliveries/${id}/status`,
    { status, notes }
  );
  return data.data;
}
