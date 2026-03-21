export interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  currency: string;
  startDate: string;
  splitMonths: number;
  splitType: "equal" | "custom";
  monthlyAmounts?: number[];
  createdAt: string;
}

export interface MonthlyTotal {
  month: string;
  label: string;
  total: number;
}

const STORAGE_KEY = "incomeflow-entries";
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function getEqualSplitAmounts(total: number, months: number) {
  const safeMonths = Math.max(1, months);
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / safeMonths);
  const remainder = totalCents - base * safeMonths;

  return Array.from({ length: safeMonths }, (_, index) => (base + (index === safeMonths - 1 ? remainder : 0)) / 100);
}

function scaleCustomAmounts(monthlyAmounts: number[], nextAmount: number) {
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

function normalizeEntry(raw: Partial<IncomeEntry>): IncomeEntry {
  const splitMonths = Math.max(1, Number(raw.splitMonths) || 1);
  const splitType = raw.splitType === "custom" ? "custom" : "equal";
  const monthlyAmounts = Array.isArray(raw.monthlyAmounts)
    ? raw.monthlyAmounts.map((value) => round2(Number(value) || 0)).slice(0, splitMonths)
    : undefined;

  const normalizedCustom = splitType === "custom" && monthlyAmounts && monthlyAmounts.length === splitMonths
    ? monthlyAmounts
    : undefined;

  const amount = normalizedCustom
    ? round2(normalizedCustom.reduce((sum, value) => sum + value, 0))
    : round2(Number(raw.amount) || 0);

  return {
    id: raw.id || crypto.randomUUID(),
    source: raw.source || "Untitled",
    amount,
    currency: raw.currency || "USD",
    startDate: raw.startDate || new Date().toISOString(),
    splitMonths,
    splitType: normalizedCustom ? "custom" : "equal",
    monthlyAmounts: normalizedCustom,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function loadEntries(): IncomeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: IncomeEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(entries: IncomeEntry[], entry: Omit<IncomeEntry, "id" | "createdAt">): IncomeEntry[] {
  const newEntry = normalizeEntry({
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  const updated = [...entries, newEntry];
  saveEntries(updated);
  return updated;
}

export function updateEntry(entries: IncomeEntry[], id: string, data: Partial<Omit<IncomeEntry, "id" | "createdAt">>): IncomeEntry[] {
  const updated = entries.map((entry) => {
    if (entry.id !== id) {
      return entry;
    }

    const merged = normalizeEntry({ ...entry, ...data });

    if (entry.splitType === "custom" && entry.monthlyAmounts && data.amount !== undefined && data.monthlyAmounts === undefined) {
      const scaledMonthlyAmounts = scaleCustomAmounts(entry.monthlyAmounts, Number(data.amount) || 0);
      return normalizeEntry({
        ...merged,
        splitType: "custom",
        monthlyAmounts: scaledMonthlyAmounts,
      });
    }

    return merged;
  });

  saveEntries(updated);
  return updated;
}

export function deleteEntry(entries: IncomeEntry[], id: string): IncomeEntry[] {
  const updated = entries.filter((entry) => entry.id !== id);
  saveEntries(updated);
  return updated;
}

export function getMonthlyDistribution(entry: IncomeEntry): { month: string; amount: number }[] {
  const start = new Date(entry.startDate);
  const amounts = entry.splitType === "custom" && entry.monthlyAmounts?.length === entry.splitMonths
    ? entry.monthlyAmounts
    : getEqualSplitAmounts(entry.amount, entry.splitMonths);

  return amounts.map((amount, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    return {
      month,
      amount: round2(amount),
    };
  });
}

export function computeMonthlyTotals(entries: IncomeEntry[], currency?: string): MonthlyTotal[] {
  const map = new Map<string, number>();
  const filteredEntries = currency ? entries.filter((entry) => entry.currency === currency) : entries;

  for (const entry of filteredEntries) {
    for (const distribution of getMonthlyDistribution(entry)) {
      map.set(distribution.month, round2((map.get(distribution.month) || 0) + distribution.amount));
    }
  }

  return Array.from(map.keys())
    .sort()
    .map((month) => {
      const [year, monthIndex] = month.split("-");

      return {
        month,
        label: `${monthNames[Number(monthIndex) - 1]} ${year}`,
        total: round2(map.get(month) || 0),
      };
    });
}

export function computeYearlyTotals(entries: IncomeEntry[], currency?: string) {
  const yearlyMap = new Map<string, number>();

  for (const month of computeMonthlyTotals(entries, currency)) {
    const year = month.month.slice(0, 4);
    yearlyMap.set(year, round2((yearlyMap.get(year) || 0) + month.total));
  }

  return Array.from(yearlyMap.entries())
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([year, total]) => ({ year, total: round2(total) }));
}
