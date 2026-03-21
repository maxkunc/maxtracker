export interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  startDate: string; // ISO date string
  splitMonths: number; // 1 = no split
  createdAt: string;
}

export interface MonthlyTotal {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2025"
  total: number;
}

const STORAGE_KEY = "incomeflow-entries";

export function loadEntries(): IncomeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: IncomeEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(entries: IncomeEntry[], entry: Omit<IncomeEntry, "id" | "createdAt">): IncomeEntry[] {
  const newEntry: IncomeEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const updated = [...entries, newEntry];
  saveEntries(updated);
  return updated;
}

export function updateEntry(entries: IncomeEntry[], id: string, data: Partial<Omit<IncomeEntry, "id" | "createdAt">>): IncomeEntry[] {
  const updated = entries.map((e) => (e.id === id ? { ...e, ...data } : e));
  saveEntries(updated);
  return updated;
}

export function deleteEntry(entries: IncomeEntry[], id: string): IncomeEntry[] {
  const updated = entries.filter((e) => e.id !== id);
  saveEntries(updated);
  return updated;
}

/**
 * Distributes income across months, handling year-end rollovers.
 */
export function getMonthlyDistribution(entry: IncomeEntry): { month: string; amount: number }[] {
  const perMonth = entry.amount / entry.splitMonths;
  const start = new Date(entry.startDate);
  const result: { month: string; amount: number }[] = [];

  for (let i = 0; i < entry.splitMonths; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({ month, amount: Math.round(perMonth * 100) / 100 });
  }
  return result;
}

export function computeMonthlyTotals(entries: IncomeEntry[]): MonthlyTotal[] {
  const map = new Map<string, number>();

  for (const entry of entries) {
    for (const dist of getMonthlyDistribution(entry)) {
      map.set(dist.month, (map.get(dist.month) || 0) + dist.amount);
    }
  }

  const months = Array.from(map.keys()).sort();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return months.map((m) => {
    const [y, mo] = m.split("-");
    return {
      month: m,
      label: `${monthNames[parseInt(mo) - 1]} ${y}`,
      total: Math.round((map.get(m) || 0) * 100) / 100,
    };
  });
}

export function computeYearlyTotals(entries: IncomeEntry[]): { year: string; total: number }[] {
  const monthly = computeMonthlyTotals(entries);
  const map = new Map<string, number>();

  for (const m of monthly) {
    const year = m.month.substring(0, 4);
    map.set(year, (map.get(year) || 0) + m.total);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, total]) => ({ year, total: Math.round(total * 100) / 100 }));
}
