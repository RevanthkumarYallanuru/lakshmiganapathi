import { api } from "@/api/client";
import type { ReportRange } from "@/api/endpoints/reports";
import { downloadFile } from "@/lib/download";
import type {
  ApiEnvelope,
  CustomerBalance,
  LedgerEntry,
  LedgerEntryType,
} from "@/types";

export interface LedgerParams {
  range?: ReportRange;
  start_date?: string;
  end_date?: string;
  order?: "asc" | "desc";
  entry_type?: LedgerEntryType;
  page?: number;
  limit?: number;
}

export async function getCustomerLedger(
  customerId: string,
  params?: LedgerParams
): Promise<ApiEnvelope<LedgerEntry[]>> {
  const { data } = await api.get<ApiEnvelope<LedgerEntry[]>>(
    `/ledger/customer/${customerId}`,
    { params }
  );
  return data;
}

export async function getCustomerBalance(
  customerId: string
): Promise<CustomerBalance> {
  const { data } = await api.get<ApiEnvelope<CustomerBalance>>(
    `/ledger/customer/${customerId}/balance`
  );
  return data.data;
}

export async function exportCustomerLedger(
  customerId: string,
  params?: LedgerParams
): Promise<void> {
  await downloadFile(
    `/ledger/customer/${customerId}/export`,
    params as Record<string, string | undefined>,
    `customer-${customerId}-ledger.xlsx`
  );
}

export async function setCustomerOpeningBalance(
  customerId: string,
  amount: number,
  notes?: string
): Promise<LedgerEntry> {
  const { data } = await api.post<ApiEnvelope<LedgerEntry>>(
    `/ledger/customer/${customerId}/opening-balance`,
    { amount, notes }
  );
  return data.data;
}
