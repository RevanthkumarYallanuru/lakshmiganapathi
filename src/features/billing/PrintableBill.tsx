import type { CSSProperties } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePrintName } from "@/hooks/useLocalizedName";
import { formatMoney } from "@/lib/money";
import type { Bill, BillItem } from "@/types";

/**
 * Formats the bill's stored transaction_at into separate date/time
 * strings — always the moment the sale actually happened, never
 * "now". Never uses `new Date()`.
 */
function splitDateTime(value: string): { date: string; time: string } {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: value, time: "" };
  return {
    date: d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function ItemRow({
  line,
  index,
  rowStyle,
}: {
  line: BillItem;
  index: number;
  rowStyle: CSSProperties;
}) {
  const itemName = usePrintName(line.item_name_snapshot, line.items?.telugu_name);
  const contentCell: CSSProperties = { ...cell, fontSize: "10px", fontWeight: 700 };
  return (
    <tr style={rowStyle}>
      <td style={cell}>{index + 1}</td>
      <td style={contentCell}>{itemName}</td>
      <td style={{ ...contentCell, textAlign: "right" }}>
        {line.quantity} {line.unit}
      </td>
      <td style={{ ...contentCell, textAlign: "right" }}>{formatMoney(line.actual_rate)}</td>
      <td style={{ ...contentCell, textAlign: "right" }}>{formatMoney(line.line_total)}</td>
    </tr>
  );
}

/** Empty ruled row — pads the item table up to the business's
 * configured row count so a 1-2 item bill doesn't look like a tiny
 * scrap next to a full one, the same fixed-row-count treatment as the
 * downloaded PDF. `&nbsp;` (not an empty string) keeps the row's
 * height identical to a real one. */
function BlankItemRow({ rowStyle }: { rowStyle: CSSProperties }) {
  return (
    <tr style={rowStyle}>
      <td style={cell}>&nbsp;</td>
      <td style={cell}>&nbsp;</td>
      <td style={cell}>&nbsp;</td>
      <td style={cell}>&nbsp;</td>
      <td style={cell}>&nbsp;</td>
    </tr>
  );
}

const cell: CSSProperties = {
  padding: "1px 3px",
  verticalAlign: "middle",
  border: "1px solid #9ca3af",
};

// Item name / quantity / rate / amount get a bit more size and weight
// for readability (S.No stays as-is — not part of the requested change).

// The item table's total body height stays fixed at this budget no
// matter how many rows the business configures (Settings → Bill Item
// Rows, 8-15) — more rows just means each one is shorter, and vice
// versa. 182px matches the original 13-row design (13 * ~14px).
const TABLE_BODY_HEIGHT_PX = 182;

// A4 portrait: 210mm x 297mm. Layout measurements per requirement:
// 10mm left/right margin, 5mm top margin, 20mm gap between the two
// copies (with a dotted cut line centered in it). Box height is
// otherwise content-driven — it hugs short bills instead of leaving a
// blank gap below the totals — with a ceiling only, as a safety cap
// for bills with many items. The one fixed part is the item table
// itself (see TABLE_BODY_HEIGHT_PX), so a 1-2 item bill doesn't look
// like a tiny scrap next to a full one.
const COPY_WIDTH_MM = 85; // (210 - 10*2 - 20) / 2
const MAX_HEIGHT_MM = 178.2; // 60% of 297mm
const DEFAULT_ROW_COUNT = 12;

/** One physical copy of the bill — rendered twice (customer/original
 * and office copies) with identical transaction data, per the
 * required two-copy shop-bill layout. This is print-layout
 * duplication only; nothing here creates a second database record. */
function BillCopy({
  bill,
  businessName,
  businessPhone,
  alternatePhone,
  businessAddress,
  proprietorName,
  customerName,
  copyLabel,
  signatureLabel,
  borderWidth,
  billNote,
  rowCount,
}: {
  bill: Bill;
  businessName: string;
  businessPhone: string | null;
  alternatePhone: string | null;
  businessAddress: string | null;
  proprietorName: string | null;
  customerName: string;
  copyLabel: string;
  signatureLabel: string;
  borderWidth: string;
  billNote: string;
  rowCount: number;
}) {
  const { t } = useLanguage();
  const isCustomerBill = bill.bill_type === "CUSTOMER";
  const { date, time } = splitDateTime(bill.transaction_at);
  const effectiveRowCount = Math.max(bill.bill_items.length, rowCount);
  const rowStyle: CSSProperties = {
    height: `${TABLE_BODY_HEIGHT_PX / rowCount}px`,
  };

  return (
    <div
      style={{
        width: `${COPY_WIDTH_MM}mm`,
        maxHeight: `${MAX_HEIGHT_MM}mm`,
        border: `${borderWidth} solid #15803d`,
        borderRadius: "4px",
        padding: "5px 6px",
        fontFamily: "Arial, sans-serif",
        fontSize: "8.5px",
        color: "#111",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: 700 }}>{businessName}</div>
        {businessAddress && (
          <div style={{ fontSize: "7.5px", color: "#444" }}>{businessAddress}</div>
        )}
        {proprietorName && (
          <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#111" }}>
            {proprietorName}
          </div>
        )}
        {(businessPhone || alternatePhone) && (
          <div style={{ fontSize: "7.5px", color: "#444" }}>
            {[businessPhone, alternatePhone]
              .filter(Boolean)
              .map((phone) => `+91 ${phone}`)
              .join(" · ")}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8px",
          borderTop: "1px dashed #15803d",
          borderBottom: "1px dashed #15803d",
          margin: "3px 0",
          padding: "2px 0",
        }}
      >
        <span>
          {t("billing.billNumber")}: <strong>{bill.bill_number}</strong>
        </span>
        <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#15803d" }}>
          {date} · {time}
        </span>
      </div>

      <table style={{ width: "100%", fontSize: "8.5px", marginBottom: "3px" }}>
        <tbody>
          {isCustomerBill ? (
            <>
              <tr>
                <td style={{ width: "24%", color: "#444" }}>{t("customers.englishName")}</td>
                <td style={{ fontSize: "9.5px", fontWeight: 800 }}>: {customerName}</td>
              </tr>
              {bill.customer_phone_snapshot && (
                <tr>
                  <td style={{ color: "#444" }}>{t("common.phone")}</td>
                  <td>: {bill.customer_phone_snapshot}</td>
                </tr>
              )}
              {bill.place_snapshot && (
                <tr>
                  <td style={{ color: "#444" }}>{t("customers.place")}</td>
                  <td>: {bill.place_snapshot}</td>
                </tr>
              )}
            </>
          ) : (
            <tr>
              <td colSpan={2}>{t("billing.walkInBill")}</td>
            </tr>
          )}
        </tbody>
      </table>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "8.5px",
          border: "1px solid #9ca3af",
        }}
      >
        <thead>
          <tr style={{ background: "#e8f5ec" }}>
            <th style={{ ...cell, textAlign: "left" }}>S.No</th>
            <th style={{ ...cell, textAlign: "left" }}>Item</th>
            <th style={{ ...cell, textAlign: "right" }}>Quantity</th>
            <th style={{ ...cell, textAlign: "right" }}>Rate</th>
            <th style={{ ...cell, textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.bill_items.map((line, index) => (
            <ItemRow key={line.id} line={line} index={index} rowStyle={rowStyle} />
          ))}
          {Array.from({
            length: Math.max(0, effectiveRowCount - bill.bill_items.length),
          }).map((_, index) => (
            <BlankItemRow key={`blank-${index}`} rowStyle={rowStyle} />
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: "1px solid #15803d", marginTop: "3px" }} />

      <table style={{ width: "100%", fontSize: "8.5px", marginTop: "2px" }}>
        <tbody>
          {Number(bill.discount) > 0 && (
            <tr>
              <td>{t("billing.billDiscount")}</td>
              <td style={{ textAlign: "right" }}>{formatMoney(bill.discount)}</td>
            </tr>
          )}
          <tr style={{ fontWeight: 700 }}>
            <td>{t("billing.grandTotal")}</td>
            <td style={{ textAlign: "right" }}>{formatMoney(bill.grand_total)}</td>
          </tr>
          {isCustomerBill && (
            <>
              {Number(bill.previous_balance) > 0 && (
                <tr>
                  <td>{t("billing.previousBalance")}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatMoney(bill.previous_balance)}
                  </td>
                </tr>
              )}
              <tr>
                <td>{t("billing.paidNow")}</td>
                <td style={{ textAlign: "right" }}>{formatMoney(bill.amount_paid)}</td>
              </tr>
              {Number(bill.amount_paid) > Number(bill.grand_total) && (
                <tr>
                  <td>{t("billing.partialBalancePaid")}</td>
                  <td style={{ textAlign: "right", color: "#15803d", fontWeight: 600 }}>
                    {formatMoney(Number(bill.amount_paid) - Number(bill.grand_total))}
                  </td>
                </tr>
              )}
              <tr style={{ fontWeight: 700 }}>
                <td>{t("customers.outstanding")}</td>
                <td style={{ textAlign: "right" }}>
                  {formatMoney(bill.overall_balance)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      <div
        style={{
          marginTop: "3px",
          fontSize: "6.5px",
          fontStyle: "italic",
          color: "#666",
          textAlign: "center",
        }}
      >
        {billNote}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "10px",
        }}
      >
        <div style={{ textAlign: "right", fontSize: "8px" }}>
          <div style={{ width: "35mm", borderTop: "1px solid #444", paddingTop: "2px" }}>
            {signatureLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "4px",
          background: "#15803d",
          color: "#fff",
          borderRadius: "3px",
          padding: "2px 0",
          fontSize: "8px",
          fontWeight: 600,
        }}
      >
        {copyLabel}
      </div>
    </div>
  );
}

/**
 * Compact two-copy shop-bill layout — the only thing that actually
 * reaches paper (see .print-only in index.css). @page is full A4
 * portrait; the two copies sit left/right with a 20mm gap (dotted cut
 * line centered in it) between them, sized purely to content (capped
 * at 60% of the page height for bills with many items) rather than a
 * fixed or floored height that leaves a blank gap on short bills.
 * Column headings are always English;
 * item/customer values follow the business's configured display
 * mode, but a printed name is always a single language — never the
 * combined "English — Telugu" the on-screen BOTH mode shows.
 */
export function PrintableBill({ bill }: { bill: Bill }) {
  const { business } = useAuth();
  const { t } = useLanguage();

  const customerName = usePrintName(
    bill.customer_name_snapshot ?? "",
    bill.customers?.telugu_name
  );

  const businessName = business?.name ?? "Lakshmi Ganapathi Enterprises";
  const businessPhone = business?.phone ?? null;
  const alternatePhone = business?.alternate_phone ?? null;
  const businessAddress = business?.address ?? null;
  const proprietorName = business?.proprietor_name ?? null;
  const billNote = business?.bill_note?.trim() || t("billing.paymentTermsNote");
  const rowCount = business?.bill_item_row_count ?? DEFAULT_ROW_COUNT;

  return (
    // display intentionally NOT set here — the .print-only class
    // controls visibility (none normally, flex only in @media print
    // or while lib/pdf.ts's capture briefly forces it visible). An
    // inline display value would always win over that class and
    // leave this rendered inline on the screen, not just on paper.
    <div
      className="print-only"
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "10mm",
      }}
    >
      <BillCopy
        bill={bill}
        businessName={businessName}
        businessPhone={businessPhone}
        alternatePhone={alternatePhone}
        businessAddress={businessAddress}
        proprietorName={proprietorName}
        customerName={customerName}
        copyLabel={t("billing.originalCopy")}
        signatureLabel={t("billing.receiversSignature")}
        borderWidth="1.5px"
        billNote={billNote}
        rowCount={rowCount}
      />
      {/* Dotted cut line centered in the 20mm gap. */}
      <div
        style={{
          alignSelf: "stretch",
          borderLeft: "1px dashed #999",
        }}
      />
      {/* Customer copy gets a doubled border — the one that leaves
          the shop, so it's the one made visually distinct. */}
      <BillCopy
        bill={bill}
        businessName={businessName}
        businessPhone={businessPhone}
        alternatePhone={alternatePhone}
        businessAddress={businessAddress}
        proprietorName={proprietorName}
        customerName={customerName}
        copyLabel={t("billing.customerCopy")}
        signatureLabel={t("billing.signatureSpace")}
        borderWidth="3px"
        billNote={billNote}
        rowCount={rowCount}
      />
    </div>
  );
}
