import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign } from "lucide-react";
import IncomeForm from "@/components/IncomeForm";
import MonthlyChart from "@/components/MonthlyChart";
import YearlySummary from "@/components/YearlySummary";
import TransactionLog from "@/components/TransactionLog";
import {
  loadEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  computeMonthlyTotals,
  computeYearlyTotals,
  type IncomeEntry,
} from "@/lib/income";

export default function Index() {
  const [entries, setEntries] = useState<IncomeEntry[]>(loadEntries);

  const handleAdd = useCallback(
    (data: Omit<IncomeEntry, "id" | "createdAt">) => {
      setEntries((prev) => addEntry(prev, data));
    },
    []
  );

  const handleUpdate = useCallback(
    (id: string, data: Partial<Omit<IncomeEntry, "id" | "createdAt">>) => {
      setEntries((prev) => updateEntry(prev, id, data));
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    setEntries((prev) => deleteEntry(prev, id));
  }, []);

  const monthlyTotals = computeMonthlyTotals(entries);
  const yearlyTotals = computeYearlyTotals(entries);
  const grandTotal = yearlyTotals.reduce((s, y) => s + y.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">IncomeFlow</h1>
            <p className="text-sm text-muted-foreground">Track &amp; visualize your income</p>
          </div>
          {grandTotal > 0 && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">All-time</p>
              <p className="text-lg font-bold text-primary">${grandTotal.toLocaleString()}</p>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <IncomeForm onAdd={handleAdd} />

        <Tabs defaultValue="monthly">
          <TabsList className="mb-4">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="log">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <MonthlyChart data={monthlyTotals} />
          </TabsContent>
          <TabsContent value="yearly">
            <YearlySummary data={yearlyTotals} />
          </TabsContent>
          <TabsContent value="log">
            <TransactionLog entries={entries} onUpdate={handleUpdate} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
