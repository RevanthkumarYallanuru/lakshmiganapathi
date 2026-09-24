/**
 * Mirrors of the backend's JSON responses. IDs are strings (BigInt
 * serialized), money fields are strings (Decimal serialized) — never
 * parsed to number for storage, only formatted for display.
 */

export type UserRole = "ADMIN" | "STAFF";

export interface AuthUser {
  id: string;
  business_id: string;
  name: string;
  username: string;
  role: UserRole;
}

export type NameDisplayMode = "ENGLISH" | "TELUGU" | "BOTH";
/** The printed bill/PDF can only show one language at a time (unlike
 * the on-screen NameDisplayMode, which allows BOTH) — a separate,
 * independently admin-controlled setting. */
export type PrintLanguage = "ENGLISH" | "TELUGU";

export interface AuthBusiness {
  id: string;
  name: string;
  proprietor_name: string | null;
  name_display_mode: NameDisplayMode;
  print_language: PrintLanguage;
  /** Free-text note printed near the bottom of the bill/PDF (e.g.
   * payment terms) — admin-editable, same pattern as proprietor_name.
   * Null means the app's own default note text is used instead. */
  bill_note: string | null;
  phone: string | null;
  /** Second contact number, shown alongside `phone` in the bill
   * header — both are admin-editable from Settings. */
  alternate_phone: string | null;
  address: string | null;
  upi_id: string | null;
  upi_phone: string | null;
  /** Item rows shown in the printed bill / downloaded PDF's item
   * table — admin-editable from Settings, clamped 8–15. Row height is
   * recomputed to keep the bill's total size fixed regardless of this
   * value. */
  bill_item_row_count: number;
}

export interface Customer {
  id: string;
  business_id: string;
  customer_code: string;
  english_name: string;
  telugu_name: string | null;
  phone: string | null;
  alternate_phone: string | null;
  place: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  telugu_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemUnit {
  id: string;
  item_id: string;
  unit: string;
  standard_price: string;
  is_default: boolean;
  is_active: boolean;
  /** When true, this unit is a container (bag/sack/bundle/...) billed
   * by actual weight — billing enters one weight per container and
   * the amount is computed from their summed kg, not a flat price
   * per container. `standard_price` is then a rate per kg. */
  is_weight_variable: boolean;
}

export interface Item {
  id: string;
  business_id: string;
  category_id: string | null;
  item_code: string;
  english_name: string;
  telugu_name: string | null;
  description: string | null;
  is_active: boolean;
  categories?: Category | null;
  item_units?: ItemUnit[];
  created_at: string;
  updated_at: string;
}

export type BillType = "CUSTOMER" | "WALK_IN";
export type BillStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface BillItem {
  id: string;
  bill_id: string;
  item_id: string;
  item_unit_id: string | null;
  item_name_snapshot: string;
  unit: string;
  quantity: string;
  standard_rate: string;
  actual_rate: string;
  discount: string;
  line_total: string;
  /** Set only for variable-weight lines — quantity/unit above already
   * carry this same total in kg, so nothing needs to special-case
   * display; this is here mainly for completeness/audit. */
  total_weight_kg?: string | null;
  /** The live item's Telugu name (item_name_snapshot is always
   * English, captured at bill time) — used to print/PDF the item in
   * Telugu when the business's print-language setting calls for it. */
  items?: { telugu_name: string | null } | null;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  bill_id: string;
  allocated_amount: string;
  payments?: Payment;
  bills?: Bill;
}

export interface Bill {
  id: string;
  business_id: string;
  bill_number: string;
  customer_id: string | null;
  bill_type: BillType;
  status: BillStatus;
  transaction_at: string;
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  place_snapshot: string | null;
  customer_address_snapshot: string | null;
  subtotal: string;
  discount: string;
  grand_total: string;
  previous_balance: string;
  amount_paid: string;
  current_bill_balance: string;
  overall_balance: string;
  notes: string | null;
  bill_items: BillItem[];
  customers?: Customer | null;
  payment_allocations?: PaymentAllocation[];
  created_at: string;
  updated_at: string;
}

export type PaymentMethod =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "OTHER";

export interface Payment {
  id: string;
  business_id: string;
  payment_number: string;
  customer_id: string;
  payment_at: string;
  amount: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  customers?: Customer;
  payment_allocations?: PaymentAllocation[];
  ledger_entries?: LedgerEntry[];
  created_at: string;
  updated_at: string;
}

/** "My Pays" — money the business owes to others (suppliers,
 * transporters, etc.). Deliberately separate from Payment/LedgerEntry
 * above: no relation to customers, bills, or the customer ledger. */
export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  telugu_name: string | null;
  phone: string | null;
  alternate_phone: string | null;
  organization: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierBalance {
  supplier_id: string;
  total_payable: string;
  total_paid: string;
  balance: string;
}

export type PayableStatus = "PENDING" | "PARTIALLY_PAID" | "PAID";

export interface PayablePayment {
  id: string;
  payable_id: string;
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  notes: string | null;
  /** Set only when this row is one payable's slice of a supplier bulk
   * payment (see SupplierPayment) — null for an ordinary single-payable
   * payment. */
  supplier_payment_id: string | null;
  created_at: string;
}

/** One bulk payment against a supplier — automatically allocated across
 * its oldest unpaid/partially-paid payables first (FIFO). Each payable
 * it touched has its own PayablePayment row (see supplier_payment_id)
 * linked back here via `payable_payments`. */
export interface SupplierPayment {
  id: string;
  business_id: string;
  supplier_id: string;
  amount: string;
  payment_date: string;
  reason: string;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  notes: string | null;
  suppliers?: Supplier;
  payable_payments?: PayablePayment[];
  created_at: string;
}

export interface Payable {
  id: string;
  business_id: string;
  supplier_id: string;
  import_id: string | null;
  total_amount: string;
  amount_paid: string;
  reason: string;
  payable_date: string;
  status: PayableStatus;
  paid_at: string | null;
  suppliers?: Supplier;
  payable_payments?: PayablePayment[];
  created_at: string;
  updated_at: string;
}

export interface Import {
  id: string;
  business_id: string;
  supplier_id: string;
  item_id: string;
  quantity: string;
  unit: string;
  amount: string;
  paid_amount: string;
  import_date: string;
  notes: string | null;
  created_by: string;
  suppliers?: Supplier;
  items?: Item;
  payables?: Payable | null;
  created_at: string;
  updated_at: string;
}

export type StockMovementType = "IMPORT" | "SALE" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  business_id: string;
  item_id: string;
  movement_type: StockMovementType;
  bill_id: string | null;
  import_id: string | null;
  transaction_at: string;
  quantity_in: string;
  quantity_out: string;
  balance_after: string;
  description: string | null;
  created_by: string;
  created_at: string;
  bills?: { bill_number: string } | null;
}

export interface StockTallyRow {
  item_id: string;
  english_name: string;
  telugu_name: string | null;
  last_import_date: string | null;
  last_import_qty: string | null;
  total_imported: string;
  total_sold: string;
  remaining_stock: string;
}

export interface PayablesInsights {
  range: { start: string; end: string };
  count: number;
  total_amount: string;
  total_paid: string;
  total_remaining: string;
  by_status: {
    PENDING: number;
    PARTIALLY_PAID: number;
    PAID: number;
  };
}

export type LedgerEntryType = "SALE" | "PAYMENT" | "RETURN" | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  business_id: string;
  customer_id: string;
  entry_type: LedgerEntryType;
  bill_id: string | null;
  payment_id: string | null;
  transaction_at: string;
  debit: string;
  credit: string;
  balance_after: string;
  description: string | null;
  created_at: string;
}

export interface CustomerBalance {
  customer_id: string;
  balance: string;
  /** Totals over the customer's whole ledger, computed server-side. */
  total_sales: string;
  total_payments: string;
}

export type DeliveryStatus =
  | "GENERATED"
  | "SENT"
  | "REACHED"
  | "BALANCE"
  | "CLEARED";

export interface DeliveryAgent {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  vehicle_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  bill_id: string;
  delivery_agent_id: string | null;
  /** A one-off agent name (e.g. "Raju - Auto") not worth adding to
   * the permanent Agents list — mutually exclusive with
   * delivery_agent_id; both null means no agent assigned. */
  temp_agent_name: string | null;
  status: DeliveryStatus;
  sent_at: string | null;
  reached_at: string | null;
  cleared_at: string | null;
  notes: string | null;
  bills?: Bill;
  delivery_agents?: DeliveryAgent | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  today: {
    bills_count: number;
    sales_total: string;
    payments_count: number;
    payments_total: string;
  };
  outstanding_total: string;
  customers_count: number;
  items_count: number;
  recent_bills: Bill[];
  recent_payments: Payment[];
}

export interface SalesReport {
  range: { start: string; end: string };
  summary: {
    total_bills: number;
    total_subtotal: string;
    total_discount: string;
    total_sales: string;
    total_paid: string;
  };
  daily: {
    date: string;
    total_bills: number;
    total_sales: string;
    total_paid: string;
  }[];
}

export interface PaymentsReport {
  range: { start: string; end: string };
  summary: { total_payments: number; total_amount: string };
  by_method: { payment_method: PaymentMethod; count: number; total_amount: string }[];
  daily: { date: string; total_payments: number; total_amount: string }[];
}

export interface OutstandingRow {
  customer_id: string;
  customer_code: string;
  english_name: string;
  telugu_name: string | null;
  phone: string | null;
  outstanding_balance: string;
  last_transaction_at: string | null;
}

export interface ItemSalesReport {
  range: { start: string; end: string };
  items: {
    item_id: string;
    item_name: string;
    unit: string;
    bill_count: number;
    total_quantity: string;
    total_sales: string;
  }[];
}

/** The envelope every backend response uses. */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}
