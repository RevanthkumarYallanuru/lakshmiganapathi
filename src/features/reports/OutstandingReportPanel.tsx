import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import {
  exportOutstandingReport,
  getOutstandingReport,
} from "@/api/endpoints/reports";
import { queryKeys } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import {
  Button,
  Pagination,
  SearchInput,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedName } from "@/hooks/useLocalizedName";
import { formatDate, formatMoney } from "@/lib/money";
import type { OutstandingRow } from "@/types";

function CustomerNameCell({ row }: { row: OutstandingRow }) {
  const name = useLocalizedName(row.english_name, row.telugu_name);
  return (
    <div>
      <p className="font-medium text-slate-800">{name}</p>
      <p className="text-xs text-slate-400">{row.customer_code}</p>
    </div>
  );
}

export function OutstandingReportPanel() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [onlyOutstanding, setOnlyOutstanding] = useState(true);
  const [exporting, setExporting] = useState(false);

  const params = { search: debouncedSearch || undefined, onlyOutstanding };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.reports.outstanding(params),
    queryFn: () => getOutstandingReport(params),
  });

  const rows = data?.data ?? [];
  const { page, totalPages, pageItems, setPage } = usePagination(rows);

  async function handleExport() {
    setExporting(true);
    try {
      await exportOutstandingReport(params);
      toast({ variant: "success", title: t("reports.exportSuccess") });
    } catch (error) {
      toast({
        variant: "error",
        title: error instanceof ApiError ? error.message : t("reports.exportError"),
      });
    } finally {
      setExporting(false);
    }
  }

  const columns: TableColumn<OutstandingRow>[] = [
    {
      key: "customer",
      header: t("reports.customer"),
      render: (row) => <CustomerNameCell row={row} />,
    },
    {
      key: "phone",
      header: t("common.phone"),
      render: (row) => row.phone ?? "—",
    },
    {
      key: "balance",
      header: t("reports.outstandingBalance"),
      render: (row) => (
        <span className="font-medium text-danger-600">
          {formatMoney(row.outstanding_balance)}
        </span>
      ),
    },
    {
      key: "last",
      header: t("reports.lastTransaction"),
      render: (row) =>
        row.last_transaction_at ? formatDate(row.last_transaction_at) : "—",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("reports.searchPlaceholder")}
            className="max-w-sm flex-1"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyOutstanding}
              onChange={(event) => setOnlyOutstanding(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
            />
            {t("reports.onlyOutstanding")}
          </label>
        </div>
        <Button variant="outline" onClick={handleExport} loading={exporting}>
          <Download className="h-4 w-4" aria-hidden />
          {t("reports.exportExcel")}
        </Button>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-2">
        <Table
          columns={columns}
          data={pageItems}
          keyExtractor={(row) => row.customer_id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel={t("common.loading")}
          emptyTitle={t("reports.noData")}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
