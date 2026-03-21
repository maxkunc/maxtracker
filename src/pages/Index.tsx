import { useEffect, useMemo, useState, useCallback } from "react";
import { DollarSign, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IncomeForm from "@/components/IncomeForm";
import MonthlyChart from "@/components/MonthlyChart";
import YearlySummary from "@/components/YearlySummary";
import TransactionLog from "@/components/TransactionLog";
import { formatCurrency, getEntryCurrencies } from "@/lib/currency";
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
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const handleAdd = useCallback((data: Omit<IncomeEntry, "id" | "createdAt">) => {
    setEntries((previous) => addEntry(previous, data));
  }, []);

  const handleUpdate = useCallback((id: string, data: Partial<Omit<IncomeEntry, "id" | "createdAt">>) => {
    setEntries((previous) => updateEntry(previous, id, data));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setEntries((previous) => deleteEntry(previous, id));
  }, []);

  const currencies = useMemo(() => getEntryCurrencies(entries), [entries]);

  useEffect(() => {
    if (currencies.length === 0) {
      return;
    }

    if (!currencies.includes(selectedCurrency)) {
      setSelectedCurrency(currencies[0]);
    }
  }, [currencies, selectedCurrency]);

  const monthlyTotals = useMemo(() => computeMonthlyTotals(entries, selectedCurrency), [entries, selectedCurrency]);
  const yearlyTotals = useMemo(() => computeYearlyTotals(entries, selectedCurrency), [entries, selectedCurrency]);
  const selectedTotal = yearlyTotals.reduce((sum, year) => sum + year.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">IncomeFlow</h1>
            <p className="text-sm text-muted-foreground">Track, split, and visualize income with flexible schedules.</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Shown in {selectedCurrency}</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(selectedTotal, selectedCurrency)}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <IncomeForm onAdd={handleAdd} />

        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Dashboard Currency</p>
              <p className="text-sm text-muted-foreground">Totals and charts are calculated per currency.</p>
            </div>
            <div className="w-full sm:w-56">
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <SelectValue placeholder="Select currency" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {(currencies.length ? currencies : [selectedCurrency]).map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="monthly">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="log">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <MonthlyChart data={monthlyTotals} currency={selectedCurrency} />
          </TabsContent>
          <TabsContent value="yearly">
            <YearlySummary data={yearlyTotals} currency={selectedCurrency} />
          </TabsContent>
          <TabsContent value="log">
            <TransactionLog entries={entries} onUpdate={handleUpdate} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
