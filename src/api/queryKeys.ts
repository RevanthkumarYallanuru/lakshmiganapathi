/** One key factory per resource, so invalidation stays consistent
 * across every feature module instead of ad-hoc string arrays. */
export const queryKeys = {
  dashboard: (params?: unknown) => ["dashboard", params ?? {}] as const,

  customers: {
    all: () => ["customers"] as const,
    list: (search?: string, activeOnly?: boolean) =>
      ["customers", "list", search ?? "", !!activeOnly] as const,
    detail: (id: string) => ["customers", "detail", id] as const,
    payments: (id: string) => ["customers", id, "payments"] as const,
  },

  categories: {
    all: () => ["categories"] as const,
    list: (search?: string) => ["categories", "list", search ?? ""] as const,
    detail: (id: string) => ["categories", "detail", id] as const,
  },

  items: {
    all: () => ["items"] as const,
    list: (params: unknown) => ["items", "list", params] as const,
    detail: (id: string) => ["items", "detail", id] as const,
    units: (id: string) => ["items", id, "units"] as const,
  },

  bills: {
    all: () => ["bills"] as const,
    list: (params: unknown) => ["bills", "list", params] as const,
    detail: (id: string) => ["bills", "detail", id] as const,
  },

  payments: {
    all: () => ["payments"] as const,
    list: (params: unknown) => ["payments", "list", params] as const,
    detail: (id: string) => ["payments", "detail", id] as const,
  },

  ledger: {
    entries: (customerId: string, params: unknown) =>
      ["ledger", customerId, "entries", params] as const,
    balance: (customerId: string) =>
      ["ledger", customerId, "balance"] as const,
  },

  deliveryAgents: {
    all: () => ["delivery-agents"] as const,
    list: (search?: string) =>
      ["delivery-agents", "list", search ?? ""] as const,
  },

  deliveries: {
    all: () => ["deliveries"] as const,
    list: (params: unknown) => ["deliveries", "list", params] as const,
    detail: (id: string) => ["deliveries", "detail", id] as const,
    byBill: (billId: string) => ["deliveries", "bill", billId] as const,
  },

  reports: {
    sales: (params: unknown) => ["reports", "sales", params] as const,
    payments: (params: unknown) => ["reports", "payments", params] as const,
    outstanding: (params: unknown) =>
      ["reports", "outstanding", params] as const,
    items: (params: unknown) => ["reports", "items", params] as const,
  },

  payables: {
    all: () => ["payables"] as const,
    list: (params: unknown) => ["payables", "list", params] as const,
    detail: (id: string) => ["payables", "detail", id] as const,
    insights: (params: unknown) => ["payables", "insights", params] as const,
  },

  suppliers: {
    all: () => ["suppliers"] as const,
    list: (search?: string, activeOnly?: boolean) =>
      ["suppliers", "list", search ?? "", !!activeOnly] as const,
    detail: (id: string) => ["suppliers", "detail", id] as const,
    balances: () => ["suppliers", "balances"] as const,
    balance: (id: string) => ["suppliers", id, "balance"] as const,
  },

  imports: {
    all: () => ["imports"] as const,
    list: (params: unknown) => ["imports", "list", params] as const,
    detail: (id: string) => ["imports", "detail", id] as const,
  },
};
