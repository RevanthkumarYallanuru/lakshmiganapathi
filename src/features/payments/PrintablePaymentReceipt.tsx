import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePrintName } from "@/hooks/useLocalizedName";
import { formatMoney } from "@/lib/money";
import type { Payment } from "@/types";

function splitDateTime(value: string): { date: string; time: string } {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: value, time: "" };
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

/** Compact printable receipt for a customer payment — the same
 * physical format as a sale bill, but never represented as one. Uses
 * the payment's own PAYMENT ledger entry for previous/after balance,
 * never recomputed from today's data. */
export function PrintablePaymentReceipt({ payment }: { payment: Payment }) {
  const { business } = useAuth();
  const { t } = useLanguage();

  const customerName = usePrintName(
    payment.customers?.english_name ?? "",
    payment.customers?.telugu_name
  );

  const ledgerEntry = (payment.ledger_entries ?? []).find(
    (entry) => entry.entry_type === "PAYMENT"
  );
  const balanceAfter = ledgerEntry ? Number(ledgerEntry.balance_after) : null;
  const previousBalance =
    balanceAfter !== null ? balanceAfter + Number(payment.amount) : null;

  const { date, time } = splitDateTime(payment.payment_at);
  const businessName = business?.name ?? "Lakshmi Ganapathi Enterprises";

  return (
    <div className="print-only" style={{ width: "100%" }}>
      <div
        style={{
          maxWidth: "80mm",
          margin: "0 auto",
          border: "1.5px solid #15803d",
          borderRadius: "4px",
          padding: "8px 10px",
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          color: "#111",
        }}
      >
        <div style={{ textAlign: "center", fontSize: "13px", fontWeight: 700 }}>
          {businessName}
        </div>
        <div style={{ textAlign: "center", fontSize: "9px", color: "#444", marginBottom: "4px" }}>
          {t("payments.receiptTitle")}
        </div>

        <div style={{ borderTop: "1px dashed #15803d", margin: "3px 0" }} />

        <table style={{ width: "100%", fontSize: "10px" }}>
          <tbody>
            <tr>
              <td style={{ color: "#444" }}>{t("payments.paymentNumber")}</td>
              <td style={{ textAlign: "right" }}>{payment.payment_number}</td>
            </tr>
            <tr>
              <td style={{ color: "#444" }}>{t("common.date")}</td>
              <td style={{ textAlign: "right" }}>
                {date} · {time}
              </td>
            </tr>
            <tr>
              <td style={{ color: "#444" }}>{t("customers.englishName")}</td>
              <td style={{ textAlign: "right" }}>{customerName}</td>
            </tr>
            {payment.customers?.phone && (
              <tr>
                <td style={{ color: "#444" }}>{t("common.phone")}</td>
                <td style={{ textAlign: "right" }}>{payment.customers.phone}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #15803d", margin: "3px 0" }} />

        <table style={{ width: "100%", fontSize: "10px" }}>
          <tbody>
            <tr>
              <td style={{ color: "#444" }}>{t("payments.method")}</td>
              <td style={{ textAlign: "right" }}>{payment.payment_method}</td>
            </tr>
            {payment.reference_number && (
              <tr>
                <td style={{ color: "#444" }}>{t("payments.reference")}</td>
                <td style={{ textAlign: "right" }}>{payment.reference_number}</td>
              </tr>
            )}
            {previousBalance !== null && (
              <tr>
                <td style={{ color: "#444" }}>{t("billing.previousBalance")}</td>
                <td style={{ textAlign: "right" }}>{formatMoney(previousBalance)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: 700, fontSize: "11.5px" }}>
              <td>{t("payments.amount")}</td>
              <td style={{ textAlign: "right" }}>{formatMoney(payment.amount)}</td>
            </tr>
            {balanceAfter !== null && (
              <tr style={{ fontWeight: 700 }}>
                <td>{t("customers.outstanding")}</td>
                <td style={{ textAlign: "right" }}>{formatMoney(balanceAfter)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {payment.notes && (
          <>
            <div style={{ borderTop: "1px dashed #15803d", margin: "3px 0" }} />
            <div style={{ fontSize: "9.5px" }}>{payment.notes}</div>
          </>
        )}

        <div style={{ marginTop: "16px", textAlign: "right", fontSize: "9px" }}>
          {business?.phone && <div>+91 {business.phone}</div>}
          <div style={{ marginTop: "10px", borderTop: "1px solid #444", paddingTop: "2px" }}>
            {t("billing.receiversSignature")}
          </div>
        </div>
      </div>
    </div>
  );
}
