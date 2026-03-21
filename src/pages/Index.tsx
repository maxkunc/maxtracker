import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { DollarSign, Filter, LogOut, Tags } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthCard from "@/components/AuthCard";
import ThemeToggle from "@/components/ThemeToggle";
import IncomeForm from "@/components/IncomeForm";
import MonthlyChart from "@/components/MonthlyChart";
import YearlySummary from "@/components/YearlySummary";
import TransactionLog from "@/components/TransactionLog";
import { supabase } from "@/integrations/supabase/client";
import { currencyOptions, formatCurrency, type CurrencyCode } from "@/lib/currency";
import {
  computeMonthlyTotals,
  computeYearlyTotals,
  filterEntriesByCategories,
  parseMonthlyAmounts,
  scaleCustomAmounts,
  toMonthlyAmountsJson,
  type Category,
  type IncomeEntry,
  type IncomeEntryInput,
} from "@/lib/income";

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("USD");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const loadTrackerData = useCallback(async (userId: string) => {
    setLoadingData(true);

    const [categoriesResponse, entriesResponse] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", userId).order("name"),
      supabase.from("income_entries").select("*").eq("user_id", userId).order("date", { ascending: false }),
    ]);

    if (categoriesResponse.error || entriesResponse.error) {
      toast.error("Could not load your data", {
        description: categoriesResponse.error?.message || entriesResponse.error?.message || "Please refresh and try again.",
      });
      setLoadingData(false);
      return;
    }

    setCategories(categoriesResponse.data || []);
    setEntries(entriesResponse.data || []);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);

      if (nextSession?.user.id) {
        void loadTrackerData(nextSession.user.id);
      } else {
        setCategories([]);
        setEntries([]);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
      if (data.session?.user.id) {
        void loadTrackerData(data.session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadTrackerData]);

  useEffect(() => {
    setSelectedCategoryIds((current) => current.filter((id) => categories.some((category) => category.id === id)));
  }, [categories]);

  const handleAddCategory = useCallback(
    async (name: string) => {
      if (!session?.user.id) {
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({ name, user_id: session.user.id })
        .select("*")
        .single();

      if (error) {
        toast.error("Could not create category", {
          description: error.message,
        });
        return;
      }

      setCategories((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Category added");
      return data.id;
    },
    [session],
  );

  const handleAddEntry = useCallback(
    async (entry: IncomeEntryInput) => {
      if (!session?.user.id) {
        return;
      }

      const { error } = await supabase.from("income_entries").insert({
        amount: entry.amount,
        category_id: entry.categoryId,
        currency: entry.currency,
        date: entry.date,
        monthly_amounts: toMonthlyAmountsJson(entry.monthlyAmounts),
        source: entry.source,
        split_months: entry.splitMonths,
        split_type: entry.splitType,
        user_id: session.user.id,
      });

      if (error) {
        toast.error("Could not save income", {
          description: error.message,
        });
        return;
      }

      toast.success("Income saved");
      await loadTrackerData(session.user.id);
    },
    [loadTrackerData, session],
  );

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      if (!session?.user.id) {
        return;
      }

      const { error } = await supabase.from("income_entries").delete().eq("id", id);

      if (error) {
        toast.error("Could not delete entry", {
          description: error.message,
        });
        return;
      }

      toast.success("Entry deleted");
      await loadTrackerData(session.user.id);
    },
    [loadTrackerData, session],
  );

  const handleUpdateEntry = useCallback(
    async (id: string, data: { amount?: number; source?: string }) => {
      if (!session?.user.id) {
        return;
      }

      const existingEntry = entries.find((entry) => entry.id === id);
      if (!existingEntry) {
        return;
      }

      const payload: Record<string, unknown> = { ...data };

      if (typeof data.amount === "number" && existingEntry.split_type === "custom") {
        const currentCustomAmounts = parseMonthlyAmounts(existingEntry.monthly_amounts);
        if (currentCustomAmounts?.length) {
          payload.monthly_amounts = toMonthlyAmountsJson(scaleCustomAmounts(currentCustomAmounts, data.amount));
        }
      }

      const { error } = await supabase.from("income_entries").update(payload).eq("id", id);

      if (error) {
        toast.error("Could not update entry", {
          description: error.message,
        });
        return;
      }

      toast.success("Entry updated");
      await loadTrackerData(session.user.id);
    },
    [entries, loadTrackerData, session],
  );

  const filteredByCategories = useMemo(
    () => filterEntriesByCategories(entries, selectedCategoryIds),
    [entries, selectedCategoryIds],
  );

  const monthlyTotals = useMemo(
    () => computeMonthlyTotals(filteredByCategories, selectedCurrency),
    [filteredByCategories, selectedCurrency],
  );

  const yearlyTotals = useMemo(
    () => computeYearlyTotals(filteredByCategories, selectedCurrency),
    [filteredByCategories, selectedCurrency],
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const selectedTotal = yearlyTotals.reduce((sum, year) => sum + year.total, 0);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Could not sign out", { description: error.message });
      return;
    }
    toast.success("Signed out");
  };

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/70 bg-card/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">IncomeFlow</h1>
                <p className="text-sm text-muted-foreground">A synced income tracker for every device.</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-5xl items-center justify-center px-4 py-10">
          <AuthCard />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">IncomeFlow</h1>
            <p className="text-sm text-muted-foreground">Track income by category, currency, and custom month splits.</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Visible total in {selectedCurrency}</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(selectedTotal, selectedCurrency)}</p>
          </div>
          <ThemeToggle />
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <IncomeForm categories={categories} disabled={loadingData} onAdd={handleAddEntry} onAddCategory={handleAddCategory} />

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="border-border/80 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4 text-primary" />
                  Dashboard currency
                </p>
                <p className="text-sm text-muted-foreground">Charts and yearly totals use the selected currency.</p>
              </div>
              <Select value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as CurrencyCode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Tags className="h-4 w-4 text-primary" />
                  Category filter
                </p>
                <p className="text-sm text-muted-foreground">Select categories to only show income from those categories.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Create categories above to start filtering.</p>
                ) : (
                  categories.map((category) => {
                    const active = selectedCategoryIds.includes(category.id);
                    return (
                      <Button
                        key={category.id}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.name}
                      </Button>
                    );
                  })
                )}
              </div>
              {selectedCategoryIds.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 p-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedCategoryIds.map((id) => (
                      <Badge key={id} variant="secondary">{categoryNames[id]}</Badge>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCategoryIds([])}>
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monthly">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="log">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <MonthlyChart currency={selectedCurrency} data={monthlyTotals} />
          </TabsContent>
          <TabsContent value="yearly">
            <YearlySummary currency={selectedCurrency} data={yearlyTotals} />
          </TabsContent>
          <TabsContent value="log">
            <TransactionLog
              categoryNames={categoryNames}
              entries={filteredByCategories}
              onDelete={handleDeleteEntry}
              onUpdate={handleUpdateEntry}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
