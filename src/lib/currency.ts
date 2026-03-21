import type { IncomeEntry } from "@/lib/income";

const fallbackCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "INR",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "NZD",
  "SGD",
  "HKD",
  "ZAR",
  "MXN",
  "BRL",
  "AED",
  "SAR",
  "CNY",
];

export const currencyOptions = (() => {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("currency").filter((code) => code.length === 3);
    }
  } catch {
    // Ignore and fall back.
  }

  return fallbackCurrencies;
})();

export function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function getEntryCurrencies(entries: IncomeEntry[]) {
  const unique = new Set(entries.map((entry) => entry.currency || "USD"));
  return Array.from(unique).sort();
}
