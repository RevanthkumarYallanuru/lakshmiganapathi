/**
 * Converts a rupee amount into the Indian-numbering (lakh/crore)
 * words form printed on the bill, e.g. 4060 -> "Four Thousand Sixty",
 * 123456.50 -> "One Lakh Twenty Three Thousand Four Hundred Fifty Six
 * Rupees and Fifty Paise". Pure presentation — never used for any
 * calculation, only for the printed/PDF "Amount in words" line.
 */

const ONES = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
  "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
  "Eighty", "Ninety",
];

/** Converts an integer in [0, 999] to words. */
function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    const tensWord = TENS[Math.floor(n / 10)];
    const onesDigit = n % 10;
    parts.push(onesDigit ? `${tensWord} ${ONES[onesDigit]}` : tensWord);
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/** Converts a non-negative integer to words using the Indian
 * lakh/crore grouping (not the Western thousand/million grouping). */
function integerToWords(value: number): string {
  if (value === 0) return "Zero";

  const crore = Math.floor(value / 1e7);
  value %= 1e7;
  const lakh = Math.floor(value / 1e5);
  value %= 1e5;
  const thousand = Math.floor(value / 1e3);
  value %= 1e3;
  const hundred = value;

  const segments: string[] = [];
  if (crore) segments.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) segments.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) segments.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) segments.push(threeDigitsToWords(hundred));

  return segments.join(" ");
}

/**
 * Formats a rupee amount as the "<words> Only" line printed below the
 * bill's totals — deliberately without the "INR" currency prefix,
 * which the caller draws separately (smaller, normal weight) ahead of
 * this bold/larger words text; see `amountInWords` for the combined
 * "INR <words> Only" form. Accepts a Decimal-as-string (as money
 * fields are always serialized) or a number; never throws on bad
 * input — falls back to "Zero Only" rather than showing a broken
 * string on a printed bill.
 */
export function amountWordsBody(value: string | number): string {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "Zero Only";

  // Round to the nearest paise first so float noise (e.g. 60.1 stored
  // as 60.099999…) never produces a spurious paise amount.
  const totalPaise = Math.round(num * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  const rupeeWords = integerToWords(rupees);
  if (paise === 0) {
    return `${rupeeWords} Only`;
  }
  const paiseWords = integerToWords(paise);
  return `${rupeeWords} Rupees and ${paiseWords} Paise Only`;
}

/** The full "INR <words> Only" form — see `amountWordsBody` for just
 * the words (no currency prefix), which is what the bill print/PDF
 * actually renders (with "INR:" drawn separately, smaller). */
export function amountInWords(value: string | number): string {
  return `INR ${amountWordsBody(value)}`;
}
