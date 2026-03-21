import type { Json, Tables } from "@/integrations/supabase/types";
import type { CurrencyCode } from "@/lib/currency";

export type Category = Tables<"categories">;
export type IncomeEntry = Tables<"income_entries">;
export type SplitType = "equal" | "custom";

export interface IncomeEntryInput {
  amount: number;
  categoryId: string | null;
  currency: CurrencyCode;
  date: string;
  monthlyAmounts?: number[] | null;
  source: string;
  splitMonths: number;
  splitType: SplitType;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function parseMonthlyAmounts(value: Json | null) {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .map((item) => round2(item));

  return parsed.length ? parsed : null;
}

export function toMonthlyAmountsJson(monthlyAmounts?: number[] | null): Json | null {
  if (!monthlyAmounts?.length) {
    return null;
  }

  return monthlyAmounts.map((value) => round2(value));
}

export function getEqualSplitAmounts(total: number, months: number) {
  const safeMonths = Math.max(1, months);
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / safeMonths);
  const remainder = totalCents - base * safeMonths;

  return Array.from({ length: safeMonths }, (_, index) => (base + (index === safeMonths - 1 ? remainder : 0)) / 100);
}

export function scaleCustomAmounts(monthlyAmounts: number[], nextAmount: number) {
  const currentTotal = monthlyAmounts.reduce((sum, value) => sum + value, 0);

  if (currentTotal <= 0) {
    return getEqualSplitAmounts(nextAmount, monthlyAmounts.length || 1);
  }

  let runningTotal = 0;
  return monthlyAmounts.map((value, index) => {
    if (index === monthlyAmounts.length - 1) {
      return round2(nextAmount - runningTotal);
    }

    const scaled = round2((value / currentTotal) * nextAmount);
    runningTotal += scaled;
    return scaled;
  });
}

export function getMonthlyDistribution(entry: IncomeEntry) {
  const baseDate = new Date(`${entry.date}T00:00:00`);
  const customAmounts = parseMonthlyAmounts(entry.monthly_amounts);
  const amounts = entry.split_type === "custom" && customAmounts?.length === entry.split_months
    ? customAmounts
    : getEqualSplitAmounts(entry.amount, entry.split_months);

  return amounts.map((amount, index) => {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + index, 1);
    return {
      amount: round2(amount),
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    };
  });
}

export function filterEntriesByCategories(entries: IncomeEntry[], selectedCategoryIds: string[]) {
  if (!selectedCategoryIds.length) {
    return entries;
  }

  return entries.filter((entry) => entry.category_id && selectedCategoryIds.includes(entry.category_id));
}

export function computeMonthlyTotals(entries: IncomeEntry[], currency: CurrencyCode) {
  const map = new Map<string, number>();

  for (const entry of entries) {
    if (entry.currency !== currency) {
      continue;
    }

    for (const distribution of getMonthlyDistribution(entry)) {
      map.set(distribution.month, round2((map.get(distribution.month) || 0) + distribution.amount));
    }
  }

  return Array.from(map.entries())
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, total]) => {
      const [year, monthNumber] = month.split("-");
      return {
        label: `${monthNames[Number(monthNumber) - 1]} ${year}`,
        month,
        total: round2(total),
      };
    });
}

export function computeYearlyTotals(entries: IncomeEntry[], currency: CurrencyCode) {
  const map = new Map<string, number>();

  for (const month of computeMonthlyTotals(entries, currency)) {
    const year = month.month.slice(0, 4);
    map.set(year, round2((map.get(year) || 0) + month.total));
  }

  return Array.from(map.entries())
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([year, total]) => ({ year, total: round2(total) }));
}
