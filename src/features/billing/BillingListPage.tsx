import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { listBills, type ListBillsParams } from "@/api/endpoints/billing";
import { queryKeys } from "@/api/queryKeys";
import {
  Badge,
  Button,
  Pagination,
  SearchInput,
  Select,
  Table,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatMoney } from "@/lib/money";
import type { Bill, BillStatus, BillType } from "@/types";

export function BillingListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<BillStatus | "">("");
  const [type, setType] = useState<BillType | "">("");

  const params: ListBillsParams = {
    search: debouncedSearch || undefined,
    bill_status: status || undefined,
    bill_type: type || undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.bills.list(params),
    queryFn: () => listBills(params),
    placeholderData: keepPreviousData,
  });

  const bills = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(bills);

  const columns: TableColumn<Bill>[] = [
    {
      key: "number",
      header: t("billing.billNumber"),
      render: (bill) => (
        <div>
          <p className="font-medium text-slate-800">{bill.bill_number}</p>
          <p className="text-xs text-slate-400">
            {bill.customer_name_snapshot ?? "Walk-in"}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: t("billing.date"),
      render: (bill) => formatDate(bill.transaction_at, true),
    },
    {
      key: "total",
      header: t("billing.grandTotal"),
      render: (bill) => formatMoney(bill.grand_total),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (bill) => (
        <Badge
          tone={
            bill.status === "CANCELLED"
              ? "danger"
              : bill.status === "COMPLETED"
                ? "success"
                : "neutral"
          }
        >
          {bill.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("billing.title")}
        </h1>
        <Button onClick={() => navigate("/billing/new")}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("billing.newBill")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("billing.searchPlaceholder")}
          className="max-w-sm flex-1"
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as BillStatus)}
          placeholder={t("billing.allStatuses")}
          options={[
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
        <Select
          value={type}
          onValueChange={(value) => setType(value as BillType)}
          placeholder={t("billing.allTypes")}
          options={[
            { value: "CUSTOMER", label: t("billing.customerBill") },
            { value: "WALK_IN", label: t("billing.walkInBill") },
          ]}
        />
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(bill) => bill.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("billing.noBills")}
          emptyDescription={t("billing.noBillsHint")}
          onRowClick={(bill) => navigate(`/billing/${bill.id}`)}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
