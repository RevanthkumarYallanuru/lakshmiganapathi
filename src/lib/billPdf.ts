import { jsPDF } from "jspdf";

import type { Bill, PrintLanguage } from "@/types";

/**
 * Direct PDF export for a bill — pure vector drawing via jsPDF, no
 * DOM/screen rasterization. An earlier html2canvas-based approach
 * (clone the live page, rasterize it) made the whole app unresponsive
 * on click, because html2canvas has to clone a large chunk of the
 * live document to capture computed styles correctly, and that
 * collided badly with React's own DOM management. This has no such
 * risk: it never touches the page DOM.
 *
 * Telugu names in the PDF: jsPDF's built-in fonts (Helvetica) can
 * only render Latin text, so a Telugu-script font (Noto Sans Telugu,
 * OFL-licensed, converted from Google's woff2 to the ttf jsPDF
 * requires) is fetched and embedded on demand — only when the
 * business's print-language setting is TELUGU and a name actually has
 * Telugu text to show. Everything else (labels, money, bill number)
 * always stays on Helvetica; only the resolved customer/item name
 * values switch fonts. Known limitation: jsPDF lays out glyphs by
 * simple left-to-right advance widths — it does not perform the
 * OpenType shaping (conjunct consonants, vowel-sign reordering) a
 * browser does, so complex Telugu conjuncts may not look quite as
 * clean here as they do via Print, which renders through the real
 * browser text engine.
 */

export interface BillPdfOptions {
  businessName: string;
  businessPhone: string | null;
  alternatePhone: string | null;
  businessAddress: string | null;
  proprietorName: string | null;
  customerNameEnglish: string;
  customerNameTelugu: string | null;
  printLanguage: PrintLanguage;
  /** Admin-editable note printed near the bottom of the bill (e.g.
   * payment terms) — caller resolves the business's custom text or
   * the app's own default before calling. */
  billNote: string;
}

const TELUGU_FONT_FAMILY = "NotoSansTelugu";
let teluguFontCache: Promise<{ regular: string; bold: string } | null> | null = null;

const TELUGU_CANVAS_FONT_FAMILY = "NotoSansTeluguCanvas";
let teluguCanvasFontCache: Promise<boolean> | null = null;
const RASTER_DPI = 300;
const PX_PER_PT = RASTER_DPI / 72;
const MM_PER_PX = 25.4 / RASTER_DPI;

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 10;
const MARGIN_T = 5;
const GAP = 20;
const COPY_W = (PAGE_W - MARGIN_L * 2 - GAP) / 2; // 85mm
const MAX_H = PAGE_H * 0.6; // 178.2mm ceiling — a safety cap for long item lists, not a floor
const FOOTER_ZONE = 16; // signature line + label, banner included below
const PAD = 4;
const GREEN: [number, number, number] = [21, 128, 61];
const GRAY: [number, number, number] = [90, 90, 90];
const NOTE_FONT_SIZE = 5.5;
const NOTE_LINE_HEIGHT = 2.6; // mm per wrapped line at NOTE_FONT_SIZE
const TELUGU_RANGE = /[ఀ-౿]/;

function containsTelugu(text: string): boolean {
  return TELUGU_RANGE.test(text);
}

/** Picks Helvetica vs the Telugu font for a single free-text business
 * field (name, address, proprietor name) based on the *actual* script
 * it contains — unlike customer/item names (which choose between two
 * stored translations via the print-language setting), these are one
 * raw field an admin can type in either script, and must render
 * correctly regardless of what print_language is set to. Falls back
 * to Helvetica if the Telugu font failed to load. */
function resolveFreeTextFont(text: string, teluguFontReady: boolean): string {
  return containsTelugu(text) && teluguFontReady ? TELUGU_FONT_FAMILY : "helvetica";
}

/** Registers the Telugu font as a real browser FontFace, so an
 * offscreen canvas can shape it the same way the browser shapes any
 * other Telugu text on the page (conjunct ligatures like య్య, correct
 * vowel-sign/anusvara positioning). jsPDF's own text drawing does not
 * perform this OpenType shaping — it lays out glyphs by simple
 * left-to-right advance widths — so Telugu runs are rendered to an
 * image via canvas and embedded instead (see `renderTeluguRunToImage`
 * and `drawMixedScriptText`), rather than drawn as jsPDF vector text. */
function ensureTeluguCanvasFont(): Promise<boolean> {
  teluguCanvasFontCache ??= (async () => {
    if (typeof FontFace === "undefined" || typeof document === "undefined") return false;
    try {
      const regular = new FontFace(
        TELUGU_CANVAS_FONT_FAMILY,
        "url(/fonts/NotoSansTelugu-Regular.ttf)",
        { weight: "400" }
      );
      const bold = new FontFace(
        TELUGU_CANVAS_FONT_FAMILY,
        "url(/fonts/NotoSansTelugu-Bold.ttf)",
        { weight: "700" }
      );
      await Promise.all([regular.load(), bold.load()]);
      document.fonts.add(regular);
      document.fonts.add(bold);
      return true;
    } catch {
      return false;
    }
  })();
  return teluguCanvasFontCache;
}

/** Renders one run of properly-shaped Telugu text to a PNG data URL at
 * print resolution (300dpi) via an offscreen canvas. Dimensions are
 * returned in mm (matching the jsPDF document's own unit) so the
 * caller can place the image with `doc.addImage` the same way it
 * would position vector text — `ascentMm` lets the caller convert
 * from a text baseline y to the image's top-left corner. */
function renderTeluguRunToImage(
  text: string,
  fontStyle: "normal" | "bold",
  fontSizePt: number,
  color: [number, number, number]
): { dataUrl: string; widthMm: number; heightMm: number; ascentMm: number } | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const weight = fontStyle === "bold" ? "700" : "400";
  const fontPx = fontSizePt * PX_PER_PT;
  ctx.font = `${weight} ${fontPx}px ${TELUGU_CANVAS_FONT_FAMILY}`;
  const metrics = ctx.measureText(text);
  const ascentPx = Math.ceil(metrics.actualBoundingBoxAscent || fontPx * 0.85);
  const descentPx = Math.ceil(metrics.actualBoundingBoxDescent || fontPx * 0.25);
  const widthPx = Math.max(1, Math.ceil(metrics.width));
  const heightPx = Math.max(1, ascentPx + descentPx);

  canvas.width = widthPx;
  canvas.height = heightPx;
  // Resizing the canvas resets its 2D context state, so font/fill
  // must be re-applied before the real draw.
  ctx.font = `${weight} ${fontPx}px ${TELUGU_CANVAS_FONT_FAMILY}`;
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, 0, ascentPx);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    widthMm: widthPx * MM_PER_PX,
    heightMm: heightPx * MM_PER_PX,
    ascentMm: ascentPx * MM_PER_PX,
  };
}

/** Measures how wide `text` would be if rendered by
 * `renderTeluguRunToImage` at this font size, without drawing anything
 * — used to truncate Telugu names to fit a column the same way
 * `truncateToWidth` does for vector text, but against the *shaped*
 * width (which can differ from jsPDF's naive per-glyph advance-width
 * estimate for conjuncts). */
function measureTeluguWidthMm(text: string, fontStyle: "normal" | "bold", fontSizePt: number): number {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 0;
  const weight = fontStyle === "bold" ? "700" : "400";
  ctx.font = `${weight} ${fontSizePt * PX_PER_PT}px ${TELUGU_CANVAS_FONT_FAMILY}`;
  return ctx.measureText(text).width * MM_PER_PX;
}

/** `truncateToWidth`'s counterpart for Telugu text rendered via
 * canvas image instead of jsPDF vector text — same ellipsis-shrink
 * approach, measured with `measureTeluguWidthMm` instead of
 * `doc.getTextWidth`. */
function truncateTeluguToWidth(
  text: string,
  fontStyle: "normal" | "bold",
  fontSizePt: number,
  maxWidthMm: number
): string {
  if (measureTeluguWidthMm(text, fontStyle, fontSizePt) <= maxWidthMm) return text;
  let result = text;
  while (result.length > 0 && measureTeluguWidthMm(`${result}…`, fontStyle, fontSizePt) > maxWidthMm) {
    result = result.slice(0, -1);
  }
  return result ? `${result}…` : "…";
}

/** Draws a name resolved by `resolvePrintName` — left-aligned,
 * truncated to `maxWidthMm` — as a properly-shaped Telugu image when
 * the resolved font is Telugu and the canvas font is ready, or as
 * normal vector text otherwise (English always takes this second
 * path, unchanged from before). `y` is the text baseline, matching
 * jsPDF's own `doc.text` convention. */
function drawResolvedName(
  doc: jsPDF,
  resolved: { text: string; font: string },
  x: number,
  y: number,
  fontStyle: "normal" | "bold",
  fontSizePt: number,
  maxWidthMm: number,
  teluguCanvasReady: boolean,
  color: [number, number, number] = [0, 0, 0]
): void {
  if (resolved.font === TELUGU_FONT_FAMILY && teluguCanvasReady) {
    const truncated = truncateTeluguToWidth(resolved.text, fontStyle, fontSizePt, maxWidthMm);
    const image = renderTeluguRunToImage(truncated, fontStyle, fontSizePt, color);
    if (image) {
      doc.addImage(image.dataUrl, "PNG", x, y - image.ascentMm, image.widthMm, image.heightMm);
      return;
    }
  }
  doc.setFont(resolved.font, fontStyle);
  doc.setFontSize(fontSizePt);
  doc.text(truncateToWidth(doc, resolved.text, maxWidthMm), x, y);
}

/** Splits text into runs of consecutive Telugu vs non-Telugu characters.
 * Needed because `resolveFreeTextFont` picks one font for the *whole*
 * string — fine for single-script fields, but a field an admin typed
 * with both scripts (e.g. "సాంబయ్య (Kumar)") silently loses whichever
 * half the chosen font has no glyphs for (the Telugu font has no Latin
 * glyphs and Helvetica has no Telugu glyphs). */
function splitScriptRuns(text: string): { text: string; telugu: boolean }[] {
  const runs: { text: string; telugu: boolean }[] = [];
  for (const ch of text) {
    const telugu = TELUGU_RANGE.test(ch);
    const last = runs[runs.length - 1];
    if (last && last.telugu === telugu) {
      last.text += ch;
    } else {
      runs.push({ text: ch, telugu });
    }
  }
  return runs;
}

/** Draws single-line free text that may mix Telugu and Latin script.
 * Telugu runs are rendered as a properly-shaped image (see
 * `renderTeluguRunToImage`) when the canvas font is ready — falling
 * back to jsPDF's own (unshaped) Telugu vector font, then to
 * Helvetica, if it isn't. Non-Telugu runs always draw as normal
 * vector text. For align: "center", the total width is measured
 * across all runs first so the combined text is still centered as one
 * block. */
function drawMixedScriptText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  fontStyle: "normal" | "bold",
  align: "center" | "left",
  teluguFontReady: boolean,
  teluguCanvasReady: boolean,
  color: [number, number, number] = [0, 0, 0]
): void {
  if ((!teluguFontReady && !teluguCanvasReady) || !containsTelugu(text)) {
    doc.setFont("helvetica", fontStyle);
    doc.text(text, x, y, { align });
    return;
  }

  const fontSizePt = doc.getFontSize();
  type Run = { text: string; telugu: boolean; width: number } & (
    | { kind: "image"; image: NonNullable<ReturnType<typeof renderTeluguRunToImage>> }
    | { kind: "text"; font: string }
  );
  const runs: Run[] = splitScriptRuns(text).map((run) => {
    if (run.telugu && teluguCanvasReady) {
      const image = renderTeluguRunToImage(run.text, fontStyle, fontSizePt, color);
      if (image) return { ...run, kind: "image", image, width: image.widthMm };
    }
    const font = run.telugu && teluguFontReady ? TELUGU_FONT_FAMILY : "helvetica";
    doc.setFont(font, fontStyle);
    return { ...run, kind: "text", font, width: doc.getTextWidth(run.text) };
  });
  const totalWidth = runs.reduce((sum, r) => sum + r.width, 0);
  let cursorX = align === "center" ? x - totalWidth / 2 : x;
  for (const run of runs) {
    if (run.kind === "image") {
      doc.addImage(
        run.image.dataUrl,
        "PNG",
        cursorX,
        y - run.image.ascentMm,
        run.image.widthMm,
        run.image.heightMm
      );
    } else {
      doc.setFont(run.font, fontStyle);
      doc.text(run.text, cursorX, y);
    }
    cursorX += run.width;
  }
}

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

async function loadFontBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

/** Fetched once per page session (not once per PDF) and reused. */
function getTeluguFontFiles() {
  teluguFontCache ??= (async () => {
    const [regular, bold] = await Promise.all([
      loadFontBase64("/fonts/NotoSansTelugu-Regular.ttf"),
      loadFontBase64("/fonts/NotoSansTelugu-Bold.ttf"),
    ]);
    if (!regular || !bold) return null;
    return { regular, bold };
  })();
  return teluguFontCache;
}

/** Registers the Telugu font on this specific jsPDF instance — VFS
 * fonts are per-document, so this runs once per `generateBillPdf`
 * call, not once per page session (unlike the base64 fetch above). */
async function ensureTeluguFont(doc: jsPDF): Promise<boolean> {
  const files = await getTeluguFontFiles();
  if (!files) return false;
  doc.addFileToVFS("NotoSansTelugu-Regular.ttf", files.regular);
  doc.addFont("NotoSansTelugu-Regular.ttf", TELUGU_FONT_FAMILY, "normal");
  doc.addFileToVFS("NotoSansTelugu-Bold.ttf", files.bold);
  doc.addFont("NotoSansTelugu-Bold.ttf", TELUGU_FONT_FAMILY, "bold");
  return true;
}

/** Resolves which text + font family to draw a name with — Telugu
 * only when the business is set to TELUGU mode, the value actually
 * has Telugu text, and the font loaded successfully; English
 * (Helvetica) otherwise. Mirrors `usePrintName`'s resolution exactly,
 * just as a plain function since this runs outside React. */
function resolvePrintName(
  english: string,
  telugu: string | null | undefined,
  useTelugu: boolean,
  teluguFontReady: boolean
): { text: string; font: string } {
  const hasTelugu = !!telugu && telugu.trim().length > 0;
  if (useTelugu && hasTelugu && teluguFontReady) {
    return { text: telugu as string, font: TELUGU_FONT_FAMILY };
  }
  return { text: english, font: "helvetica" };
}

/**
 * Grid rows have a fixed height (so row-separator lines stay
 * aligned), so item names can't be allowed to wrap the way
 * `maxWidth` alone would — a wrapped second line would spill past
 * the row's own border into the row below it. Truncates with an
 * ellipsis instead, measured against whichever font is currently
 * active on `doc` (the caller must set font/size before calling).
 */
function truncateToWidth(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let result = text;
  while (result.length > 0 && doc.getTextWidth(`${result}…`) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result ? `${result}…` : "…";
}

/** Shrinks the currently-active font size just enough for `text` to
 * fit `maxWidth`, down to a floor — used for quantity/rate/amount
 * cells, which (unlike item names) must never be truncated since a
 * clipped digit would misstate a real figure. Leaves `doc`'s font
 * size at whatever it picked; callers must reset it for the next
 * cell. Column widths are sized generously for normal bills, so this
 * only engages for unusually large numbers. */
function fitMoneyFontSize(doc: jsPDF, text: string, maxWidth: number, baseSize: number): void {
  let size = baseSize;
  doc.setFontSize(size);
  while (size > 5 && doc.getTextWidth(text) > maxWidth) {
    size -= 0.25;
    doc.setFontSize(size);
  }
}

/** Wraps `noteText` to the copy's content width at the note's own
 * font — the admin-edited note can be any length, so its actual line
 * count (not an assumed single line) drives both the box-height
 * pre-measurement and the real draw, the same guard against
 * fixed-height-vs-wrapped-text overflow as `truncateToWidth` above. */
function getNoteLines(doc: jsPDF, noteText: string): string[] {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(NOTE_FONT_SIZE);
  return doc.splitTextToSize(noteText, COPY_W - PAD * 2) as string[];
}

/**
 * How far (from the box top) the totals section ends — computed
 * arithmetically with the exact same increments `drawCopy` uses, so
 * the box height can be decided (and the border/footer positioned)
 * *before* anything is drawn, without rendering the page twice.
 */
function measureContentEnd(doc: jsPDF, bill: Bill, opts: BillPdfOptions): number {
  const isCustomerBill = bill.bill_type === "CUSTOMER";
  let cy = 7;
  cy += 3.6; // address line (reserved even if absent — keeps both copies identical)
  if (opts.proprietorName) cy += 4; // proprietor name, its own line
  const hasPhoneLine = !!(opts.businessPhone || opts.alternatePhone);
  if (hasPhoneLine) cy += 3.4; // phone number(s) line
  cy += 3 + 4 + 2 + 4; // dashed divider + bill number/date block
  if (isCustomerBill) {
    cy += 3.6; // name (bold, slightly bigger than the other rows)
    if (bill.customer_phone_snapshot) cy += 3.4;
    if (bill.place_snapshot) cy += 3.4;
  } else {
    cy += 3.4;
  }
  cy += 1.5; // gap before table
  cy += 5; // table header row
  cy += bill.bill_items.length * 4; // one gridded row per item
  cy += 3; // gap before totals (table's own bottom border closes it)
  if (Number(bill.discount) > 0) cy += 3.6;
  cy += 3.6; // grand total
  if (isCustomerBill) {
    if (Number(bill.previous_balance) > 0) cy += 3.6;
    cy += 3.6; // paid now
    if (Number(bill.amount_paid) > Number(bill.grand_total)) cy += 3.6; // partial balance paid
    cy += 3.6; // balance row
  }
  // cy now sits at the note's own draw position; footerY (in drawCopy)
  // adds a small gap after however many lines the note wraps to.
  const noteLines = getNoteLines(doc, opts.billNote);
  cy += (noteLines.length - 1) * NOTE_LINE_HEIGHT;
  return cy;
}

function drawCopy(
  doc: jsPDF,
  x: number,
  y0: number,
  bill: Bill,
  opts: BillPdfOptions,
  copyLabel: string,
  signatureLabel: string,
  borderWidth: number,
  useTelugu: boolean,
  teluguFontReady: boolean,
  teluguCanvasReady: boolean
) {
  const isCustomerBill = bill.bill_type === "CUSTOMER";
  const { date, time } = splitDateTime(bill.transaction_at);
  const centerX = x + COPY_W / 2;
  const contentRight = x + COPY_W - PAD;

  let cy = y0 + 7;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  drawMixedScriptText(
    doc,
    opts.businessName,
    centerX,
    cy,
    "bold",
    "center",
    teluguFontReady,
    teluguCanvasReady
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  if (opts.businessAddress) {
    cy += 3.6;
    doc.setFont(resolveFreeTextFont(opts.businessAddress, teluguFontReady), "normal");
    doc.text(opts.businessAddress, centerX, cy, { align: "center", maxWidth: COPY_W - PAD * 2 });
  }
  if (opts.proprietorName) {
    cy += 4;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    drawMixedScriptText(
      doc,
      opts.proprietorName,
      centerX,
      cy,
      "bold",
      "center",
      teluguFontReady,
      teluguCanvasReady
    );
  }
  const phoneNumbers = [opts.businessPhone, opts.alternatePhone]
    .filter(Boolean)
    .map((phone) => `+91 ${phone}`)
    .join(" . ");
  if (phoneNumbers) {
    cy += 3.4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(phoneNumbers, centerX, cy, { align: "center" });
  }

  cy += 3;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(x + PAD, cy, contentRight, cy);
  cy += 4;

  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text(`Bill Number: ${bill.bill_number}`, x + PAD, cy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text(`${date} . ${time}`, contentRight, cy, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  cy += 2;
  doc.line(x + PAD, cy, contentRight, cy);
  doc.setLineDashPattern([], 0);
  cy += 4;

  if (isCustomerBill) {
    doc.setTextColor(...GRAY);
    doc.text("Name", x + PAD, cy);
    doc.setTextColor(0, 0, 0);
    // Drawn as two separate text() calls, not one concatenated string —
    // the Telugu font only embeds Telugu-script glyphs (no Latin), so a
    // single call mixing ": " with a Telugu name would hit a missing
    // glyph and silently draw nothing at all for the whole string.
    doc.setFont("helvetica", "normal");
    doc.text(":", x + PAD + 13, cy);
    const custName = resolvePrintName(
      opts.customerNameEnglish,
      opts.customerNameTelugu,
      useTelugu,
      teluguFontReady
    );
    const nameMaxWidth = COPY_W - PAD * 2 - 16;
    drawResolvedName(
      doc,
      custName,
      x + PAD + 16,
      cy,
      "bold",
      8.5,
      nameMaxWidth,
      teluguCanvasReady
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    cy += 3.6;
    if (bill.customer_phone_snapshot) {
      doc.setTextColor(...GRAY);
      doc.text("Phone", x + PAD, cy);
      doc.setTextColor(0, 0, 0);
      doc.text(`: ${bill.customer_phone_snapshot}`, x + PAD + 13, cy);
      cy += 3.4;
    }
    if (bill.place_snapshot) {
      doc.setTextColor(...GRAY);
      doc.text("Place", x + PAD, cy);
      doc.setTextColor(0, 0, 0);
      doc.text(`: ${bill.place_snapshot}`, x + PAD + 13, cy, {
        maxWidth: COPY_W - PAD * 2 - 13,
      });
      cy += 3.4;
    }
  } else {
    doc.setTextColor(0, 0, 0);
    doc.text("Walk-in bill", x + PAD, cy);
    cy += 3.4;
  }

  cy += 1.5;

  // Grid table: explicit column boundaries (not just text-anchor
  // x-positions) so real row/column separator lines can be drawn,
  // not just a top/bottom rule.
  const headerH = 5;
  const rowH = 4;
  const tableTop = cy;
  const tableBottom = tableTop + headerH + bill.bill_items.length * rowH;
  const b0 = x + PAD;
  const b1 = b0 + 8; // S.No | Item
  const b2 = b1 + 22; // Item | Quantity
  const b3 = b2 + 14; // Quantity | Rate
  const b4 = b3 + 15; // Rate | Amount — wide enough for 3-digit rates without crowding Amount
  const b5 = contentRight; // = b4 + 18, right edge — wide enough for 4-digit line totals

  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.25);
  doc.rect(b0, tableTop, b5 - b0, tableBottom - tableTop);
  doc.line(b0, tableTop + headerH, b5, tableTop + headerH);
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.12);
  for (const bx of [b1, b2, b3, b4]) {
    doc.line(bx, tableTop, bx, tableBottom);
  }
  for (let i = 1; i < bill.bill_items.length; i++) {
    const rowY = tableTop + headerH + i * rowH;
    doc.line(b0, rowY, b5, rowY);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  const headerTextY = tableTop + 3.5;
  doc.text("S.No", b0 + 1, headerTextY);
  doc.text("Item", b1 + 1, headerTextY);
  doc.text("Quantity", b3 - 1, headerTextY, { align: "right" });
  doc.text("Rate", b4 - 1, headerTextY, { align: "right" });
  doc.text("Amount", b5 - 1, headerTextY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const itemColWidth = b2 - b1 - 2;
  for (const [index, line] of bill.bill_items.entries()) {
    const rowTextY = tableTop + headerH + index * rowH + 3;
    doc.setFont("helvetica", "normal");
    doc.text(String(index + 1), b0 + 1, rowTextY);
    const itemName = resolvePrintName(
      line.item_name_snapshot,
      line.items?.telugu_name,
      useTelugu,
      teluguFontReady
    );
    const singleLineName = itemName.text.replace(/\s+/g, " ").trim();
    drawResolvedName(
      doc,
      { text: singleLineName, font: itemName.font },
      b1 + 1,
      rowTextY,
      "normal",
      7,
      itemColWidth,
      teluguCanvasReady
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const qtyText = `${line.quantity} ${line.unit}`;
    fitMoneyFontSize(doc, qtyText, b3 - b2 - 2, 7);
    doc.text(qtyText, b3 - 1, rowTextY, { align: "right" });
    const rateText = money(line.actual_rate);
    fitMoneyFontSize(doc, rateText, b4 - b3 - 2, 7);
    doc.text(rateText, b4 - 1, rowTextY, { align: "right" });
    const amountText = money(line.line_total);
    fitMoneyFontSize(doc, amountText, b5 - b4 - 2, 7);
    doc.text(amountText, b5 - 1, rowTextY, { align: "right" });
    doc.setFontSize(7);
  }

  cy = tableBottom + 3;

  doc.setFontSize(7.5);
  if (Number(bill.discount) > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Bill Discount", x + PAD, cy);
    doc.text(money(bill.discount), contentRight, cy, { align: "right" });
    cy += 3.6;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total", x + PAD, cy);
  doc.text(money(bill.grand_total), contentRight, cy, { align: "right" });
  cy += 3.6;

  if (isCustomerBill) {
    if (Number(bill.previous_balance) > 0) {
      doc.setFont("helvetica", "normal");
      doc.text("Previous Balance", x + PAD, cy);
      doc.text(money(bill.previous_balance), contentRight, cy, { align: "right" });
      cy += 3.6;
    }
    doc.setFont("helvetica", "normal");
    doc.text("Paid Now", x + PAD, cy);
    doc.text(money(bill.amount_paid), contentRight, cy, { align: "right" });
    cy += 3.6;
    const excessPaid = Number(bill.amount_paid) - Number(bill.grand_total);
    if (excessPaid > 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GREEN);
      doc.text("Partial Balance Paid", x + PAD, cy);
      doc.text(money(excessPaid), contentRight, cy, { align: "right" });
      doc.setTextColor(0, 0, 0);
      cy += 3.6;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Balance", x + PAD, cy);
    doc.text(money(bill.overall_balance), contentRight, cy, { align: "right" });
    cy += 3.6;
  }

  const noteLines = getNoteLines(doc, opts.billNote);
  doc.setTextColor(...GRAY);
  for (const [lineIndex, line] of noteLines.entries()) {
    doc.text(line, centerX, cy + lineIndex * NOTE_LINE_HEIGHT, { align: "center" });
  }
  doc.setTextColor(0, 0, 0);
  cy += (noteLines.length - 1) * NOTE_LINE_HEIGHT;

  // Footer (signature/banner) always sits a small, fixed gap after
  // wherever the content actually ends — never bottom-anchored to a
  // taller box, which is what previously left a large dead gap above
  // it on short bills.
  const footerY = cy + 4;

  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.2);
  doc.line(contentRight - 30, footerY + 4, contentRight, footerY + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text(signatureLabel, contentRight, footerY + 7.5, { align: "right" });

  const bannerY = footerY + FOOTER_ZONE - 6;
  doc.setFillColor(...GREEN);
  doc.rect(x, bannerY, COPY_W, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(copyLabel, centerX, bannerY + 4, { align: "center" });
  doc.setTextColor(0, 0, 0);

  const actualBottom = bannerY + 6;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(borderWidth);
  doc.roundedRect(x, y0, COPY_W, actualBottom - y0, 1.5, 1.5);
}

export async function generateBillPdf(bill: Bill, opts: BillPdfOptions): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const useTelugu = opts.printLanguage === "TELUGU";
  const needsTeluguFont =
    (useTelugu &&
      (!!opts.customerNameTelugu?.trim() ||
        bill.bill_items.some((line) => !!line.items?.telugu_name?.trim()))) ||
    containsTelugu(opts.businessName) ||
    containsTelugu(opts.businessAddress ?? "") ||
    containsTelugu(opts.proprietorName ?? "");
  const teluguFontReady = needsTeluguFont ? await ensureTeluguFont(doc) : false;
  // Same condition as needsTeluguFont — anywhere the PDF would draw
  // Telugu vector text, it now draws a properly-shaped canvas image
  // instead (see drawResolvedName/drawMixedScriptText).
  const teluguCanvasReady = needsTeluguFont ? await ensureTeluguCanvasFont() : false;

  const y0 = MARGIN_T;
  const naturalHeight = measureContentEnd(doc, bill, opts) + 4 + FOOTER_ZONE;
  const boxHeight = Math.min(naturalHeight, MAX_H);

  const leftX = MARGIN_L;
  const rightX = MARGIN_L + COPY_W + GAP;

  // Dotted cut line centered in the gap between the two copies.
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  const dividerX = leftX + COPY_W + GAP / 2;
  doc.line(dividerX, y0, dividerX, y0 + boxHeight);
  doc.setLineDashPattern([], 0);

  drawCopy(
    doc,
    leftX,
    y0,
    bill,
    opts,
    "ORIGINAL COPY",
    "Receiver's Signature",
    0.5,
    useTelugu,
    teluguFontReady,
    teluguCanvasReady
  );
  drawCopy(
    doc,
    rightX,
    y0,
    bill,
    opts,
    "CUSTOMER COPY",
    "Signature",
    1,
    useTelugu,
    teluguFontReady,
    teluguCanvasReady
  );

  doc.save(`${bill.bill_number}.pdf`);
}
