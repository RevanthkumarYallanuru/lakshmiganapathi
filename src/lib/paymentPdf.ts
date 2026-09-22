import { jsPDF } from "jspdf";

import type { Payment } from "@/types";

/** Direct PDF export for a payment receipt — see billPdf.ts for why
 * this is pure vector drawing rather than a screen rasterization. */

export interface PaymentPdfOptions {
  businessName: string;
  businessPhone: string | null;
  customerName: string;
  previousBalance: number | null;
  balanceAfter: number | null;
}

const GREEN: [number, number, number] = [21, 128, 61];
const GRAY: [number, number, number] = [90, 90, 90];

function money(value: string | number): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "Rs. 0.00";
  return `Rs. ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function splitDateTime(value: string): { date: string; time: string } {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: value, time: "" };
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

export async function generatePaymentPdf(
  payment: Payment,
  opts: PaymentPdfOptions
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
  const pageW = 148;
  const x = 15;
  const width = pageW - 30;
  const right = x + width;
  const centerX = x + width / 2;

  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, 15, width, 90, 2, 2);

  let cy = 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(opts.businessName, centerX, cy, { align: "center" });

  cy += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Payment Receipt", centerX, cy, { align: "center" });

  cy += 4;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(x + 5, cy, right - 5, cy);
  doc.setLineDashPattern([], 0);

  const { date, time } = splitDateTime(payment.payment_at);
  const rows: [string, string][] = [
    ["Payment Number", payment.payment_number],
    ["Date", `${date} . ${time}`],
    ["Name", opts.customerName],
  ];
  if (opts.previousBalance !== null) {
    rows.push(["Previous Balance", money(opts.previousBalance)]);
  }

  cy += 6;
  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(label, x + 5, cy);
    doc.setTextColor(0, 0, 0);
    doc.text(value, right - 5, cy, { align: "right" });
    cy += 5.5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Amount Paid", x + 5, cy);
  doc.text(money(payment.amount), right - 5, cy, { align: "right" });
  cy += 6;

  if (opts.balanceAfter !== null) {
    doc.setFontSize(9);
    doc.text("Balance", x + 5, cy);
    doc.text(money(opts.balanceAfter), right - 5, cy, { align: "right" });
  }

  if (opts.businessPhone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`+91 ${opts.businessPhone}`, right - 5, 95, { align: "right" });
  }

  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.2);
  doc.line(right - 35, 99, right - 5, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Receiver's Signature", right - 5, 102, { align: "right" });

  doc.save(`${payment.payment_number}.pdf`);
}
