import { useMemo, useState } from "react";

/** Client-side pagination for list endpoints that return the full
 * result set (customers, items, bills, payments, deliveries — all
 * within this business's expected scale of a few hundred rows). */
export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  return {
    page: safePage,
    totalPages,
    pageItems,
    setPage,
  };
}
