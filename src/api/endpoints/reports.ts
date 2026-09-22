import { api } from "@/api/client";
import { downloadFile } from "@/lib/download";
import type {
  ApiEnvelope,
  DashboardData,
  ItemSalesReport,
  OutstandingRow,
  PaymentsReport,
  SalesReport,
} from "@/types";

export type ReportRange = "today" | "week" | "month" | "year" | "custom";

export interface RangeParams {
  range: ReportRange;
  start_date?: string;
  end_date?: string;
}

export async function getDashboard(params?: RangeParams): Promise<DashboardData> {
  const { data } = await api.get<ApiEnvelope<DashboardData>>(
    "/reports/dashboard",
    { params }
  );
  return data.data;
}

export async function getSalesReport(
  params: RangeParams
): Promise<SalesReport> {
  const { data } = await api.get<ApiEnvelope<SalesReport>>(
    "/reports/sales",
    { params }
  );
  return data.data;
}

export async function exportSalesReport(params: RangeParams): Promise<void> {
  await downloadFile(
    "/reports/sales/export",
    params as unknown as Record<string, string>,
    "sales-report.xlsx"
  );
}

export async function getPaymentsReport(
  params: RangeParams
): Promise<PaymentsReport> {
  const { data } = await api.get<ApiEnvelope<PaymentsReport>>(
    "/reports/payments",
    { params }
  );
  return data.data;
}

export async function exportPaymentsReport(
  params: RangeParams
): Promise<void> {
  await downloadFile(
    "/reports/payments/export",
    params as unknown as Record<string, string>,
    "payments-report.xlsx"
  );
}

export async function getOutstandingReport(params?: {
  search?: string;
  onlyOutstanding?: boolean;
}): Promise<ApiEnvelope<OutstandingRow[]>> {
  const { data } = await api.get<ApiEnvelope<OutstandingRow[]>>(
    "/reports/customers/outstanding",
    {
      params: {
        search: params?.search || undefined,
        onlyOutstanding:
          params?.onlyOutstanding === undefined
            ? undefined
            : String(params.onlyOutstanding),
      },
    }
  );
  return data;
}

export async function exportOutstandingReport(params?: {
  search?: string;
  onlyOutstanding?: boolean;
}): Promise<void> {
  await downloadFile(
    "/reports/customers/outstanding/export",
    {
      search: params?.search,
      onlyOutstanding:
        params?.onlyOutstanding === undefined
          ? undefined
          : String(params.onlyOutstanding),
    },
    "outstanding-report.xlsx"
  );
}

export async function getItemSalesReport(
  params: RangeParams
): Promise<ItemSalesReport> {
  const { data } = await api.get<ApiEnvelope<ItemSalesReport>>(
    "/reports/items",
    { params }
  );
  return data.data;
}

export async function exportItemSalesReport(
  params: RangeParams
): Promise<void> {
  await downloadFile(
    "/reports/items/export",
    params as unknown as Record<string, string>,
    "item-sales-report.xlsx"
  );
}
