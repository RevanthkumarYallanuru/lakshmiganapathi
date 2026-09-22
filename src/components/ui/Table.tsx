import type { ReactNode } from "react";

import { LoadingState } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

/**
 * The one list/table component used across every module — every
 * screen gets consistent loading/empty/error states and a scrollable,
 * horizontally-safe layout on small screens for free.
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  isError,
  onRetry,
  loadingLabel = "Loading...",
  emptyTitle = "No results found.",
  emptyDescription,
  onRowClick,
}: TableProps<T>) {
  if (isLoading) return <LoadingState label={loadingLabel} />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-2 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                "text-slate-700",
                onRowClick && "cursor-pointer hover:bg-slate-50"
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === "Enter") onRowClick(row);
                    }
                  : undefined
              }
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-3 py-2.5", column.className)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
