import { VAT_RATE } from "@/lib/admin/constants";
import type { DocumentTotals, LineItem } from "@/lib/admin/types";

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  const qty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  const price = Number.isFinite(unitPrice) ? Math.max(0, unitPrice) : 0;
  return roundCurrency(qty * price);
}

export function calculateLineItems(items: LineItem[]): LineItem[] {
  return items.map((item) => ({
    ...item,
    total: calculateLineTotal(item.quantity, item.unitPrice),
  }));
}

export function calculateSubtotal(items: LineItem[]): number {
  return roundCurrency(
    items.reduce(
      (sum, item) => sum + calculateLineTotal(item.quantity, item.unitPrice),
      0
    )
  );
}

export function calculateTotals(
  items: LineItem[],
  includeVat: boolean,
  currency: DocumentTotals["currency"] = "MZN",
  vatRate: number = VAT_RATE
): DocumentTotals {
  const subtotal = calculateSubtotal(items);
  const vatAmount = includeVat ? roundCurrency(subtotal * vatRate) : 0;
  const grandTotal = roundCurrency(subtotal + vatAmount);

  return {
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    includeVat,
    currency,
  };
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(
  value: number,
  currency: DocumentTotals["currency"] = "MZN"
): string {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function formatDateShort(date: string): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}
