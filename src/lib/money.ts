/**
 * Display-only money formatting. The value it renders always comes
 * straight from a backend response string — this file never computes
 * a balance/total itself, it only formats one the server already sent.
 */
export function formatMoney(value: string | number): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "₹0.00";

  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string, withTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
