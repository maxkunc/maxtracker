export const currencyOptions = ["USD", "EUR", "CZK"] as const;

export type CurrencyCode = (typeof currencyOptions)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "CZK";

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
