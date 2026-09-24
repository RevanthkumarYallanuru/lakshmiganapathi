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

/** Every ledger entry matching the filters, newest first — fetched page
 * by page (the API caps a page at 500) until the server's own total is
 * reached, so a long history is never cut off. */
export async function getAllCustomerLedger(
  customerId: string,
  params?: Omit<LedgerParams, "page" | "limit">
): Promise<LedgerEntry[]> {
  const limit = 500;
  const entries: LedgerEntry[] = [];

  for (let page = 1; ; page++) {
    const res = await getCustomerLedger(customerId, { ...params, page, limit });
    entries.push(...res.data);

    const total = res.total ?? entries.length;
    if (res.data.length === 0 || entries.length >= total) break;
  }

  return entries;
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
