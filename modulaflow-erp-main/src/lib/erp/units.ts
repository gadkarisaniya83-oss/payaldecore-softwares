/**
 * Measurement + formula engine.
 * MM is the master internal dimension. Everything converts to mm on entry.
 */

export type LengthUnit = "mm" | "cm" | "inch" | "ft" | "m";

export const TO_MM: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  inch: 25.4,
  ft: 304.8,
  m: 1000,
};

export const SQFT_DIVISOR = 92_903.04;
export const RFT_DIVISOR = 304.8;

export function toMm(value: number, unit: LengthUnit): number {
  return value * TO_MM[unit];
}

export function fromMm(mm: number, unit: LengthUnit): number {
  return mm / TO_MM[unit];
}

/** Feet + inch entry, e.g. 8 ft 6 in -> mm */
export function feetInchToMm(feet: number, inch: number): number {
  return feet * TO_MM.ft + inch * TO_MM.inch;
}

export function areaSqft(lengthMm: number, widthMm: number): number {
  return (lengthMm * widthMm) / SQFT_DIVISOR;
}

export function areaSqm(lengthMm: number, widthMm: number): number {
  return (lengthMm * widthMm) / 1_000_000;
}

export function rft(lengthMm: number): number {
  return lengthMm / RFT_DIVISOR;
}

/** Edge band: only the edges flagged true are banded. Returns RFT. */
export function edgeBandRft(
  lengthMm: number,
  widthMm: number,
  edges: { e1?: boolean; e2?: boolean; e3?: boolean; e4?: boolean },
): number {
  const total =
    (edges.e1 ? lengthMm : 0) +
    (edges.e2 ? widthMm : 0) +
    (edges.e3 ? lengthMm : 0) +
    (edges.e4 ? widthMm : 0);
  return rft(total);
}

export function wastageQty(baseQty: number, wastagePercent: number): number {
  return (baseQty * wastagePercent) / 100;
}

export function procurementQty(baseQty: number, wastagePercent: number): number {
  return baseQty + wastageQty(baseQty, wastagePercent);
}

/** Sheets required for an area, with optional round-up procurement rule. */
export function sheetsRequired(
  requiredSqft: number,
  sheetLengthFt: number,
  sheetWidthFt: number,
  roundUp = true,
): number {
  const perSheet = sheetLengthFt * sheetWidthFt;
  const raw = requiredSqft / perSheet;
  return roundUp ? Math.ceil(raw) : raw;
}

export type PricingMethod = "markup" | "margin";

/** Markup: cost x (1 + p). Margin: cost / (1 - p). Not the same thing. */
export function sellingPrice(cost: number, percent: number, method: PricingMethod): number {
  const p = percent / 100;
  return method === "markup" ? cost * (1 + p) : cost / (1 - p);
}

export function grossMarginPct(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

/** Configurable rounding engine. */
export const ROUNDING = {
  measurement: 2,
  quantity: 3,
  rate: 2,
  amount: 2,
} as const;

export function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Line-level GST. Taxable value is computed after item-level discount. */
export interface TaxLineInput {
  qty: number;
  rate: number;
  discountAmount?: number;
  gstRate: number;
  interState: boolean;
}

export interface TaxLineResult {
  gross: number;
  discount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export function computeTaxLine(input: TaxLineInput): TaxLineResult {
  const gross = round(input.qty * input.rate, ROUNDING.amount);
  const discount = round(input.discountAmount ?? 0, ROUNDING.amount);
  const taxableValue = round(gross - discount, ROUNDING.amount);
  const tax = round((taxableValue * input.gstRate) / 100, ROUNDING.amount);
  const igst = input.interState ? tax : 0;
  const half = input.interState ? 0 : round(tax / 2, ROUNDING.amount);
  return {
    gross,
    discount,
    taxableValue,
    cgst: half,
    sgst: half,
    igst,
    total: round(taxableValue + tax, ROUNDING.amount),
  };
}

export const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const INR2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const NUM = new Intl.NumberFormat("en-IN");

/** Structured document numbering: QT-26-27-00001 */
export function documentNumber(prefix: string, fyStart: number, serial: number): string {
  const a = String(fyStart % 100).padStart(2, "0");
  const b = String((fyStart + 1) % 100).padStart(2, "0");
  return `${prefix}-${a}-${b}-${String(serial).padStart(5, "0")}`;
}
