import { useEffect, useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { ArrowDownCircle, CalendarIcon, FolderPlus, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { currencyOptions, formatCurrency, type CurrencyCode } from "@/lib/currency";
import { getEqualSplitAmounts, type Category, type IncomeEntryInput, type SplitType } from "@/lib/income";

interface IncomeFormProps {
  categories: Category[];
  disabled?: boolean;
  onAdd: (entry: IncomeEntryInput) => Promise<void>;
  onAddCategory: (name: string) => Promise<string | void>;
}

export default function IncomeForm({ categories, disabled, onAdd, onAddCategory }: IncomeFormProps) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [date, setDate] = useState<Date>();
  const [categoryId, setCategoryId] = useState("none");
  const [newCategory, setNewCategory] = useState("");
  const [split, setSplit] = useState(false);
  const [splitMonths, setSplitMonths] = useState("3");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customAmounts, setCustomAmounts] = useState<string[]>(["0.00", "0.00", "0.00"]);
  const [submitting, setSubmitting] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const monthCount = parseInt(splitMonths, 10);
  const numericAmount = parseFloat(amount || "0");

  useEffect(() => {
    if (splitType === "custom") {
      setCustomAmounts(getEqualSplitAmounts(numericAmount || 0, monthCount).map((value) => value.toFixed(2)));
    }
  }, [splitType, monthCount]);

  const monthLabels = useMemo(
    () =>
      Array.from({ length: monthCount }, (_, index) => {
        const currentDate = date ? addMonths(date, index) : null;
        return currentDate ? format(currentDate, "MMM yyyy") : `Month ${index + 1}`;
      }),
    [date, monthCount],
  );

  const customTotal = customAmounts.reduce((sum, value) => sum + (parseFloat(value || "0") || 0), 0);
  const customSplitValid = !split || splitType === "equal" || Math.abs(customTotal - numericAmount) < 0.01;

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      return;
    }

    setCreatingCategory(true);
    const createdId = await onAddCategory(newCategory.trim());
    if (createdId) {
      setCategoryId(createdId);
      setNewCategory("");
    }
    setCreatingCategory(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!source || !amount || !date || !customSplitValid) {
      return;
    }

    setSubmitting(true);
    await onAdd({
      amount: numericAmount,
      categoryId: categoryId === "none" ? null : categoryId,
      currency,
      date: format(date, "yyyy-MM-dd"),
      monthlyAmounts:
        split && splitType === "custom"
          ? customAmounts.map((value) => Number((parseFloat(value || "0") || 0).toFixed(2)))
          : null,
      source,
      splitMonths: split ? monthCount : 1,
      splitType: split ? splitType : "equal",
    });
    setSubmitting(false);

    setSource("");
    setAmount("");
    setCurrency("USD");
    setDate(undefined);
    setCategoryId("none");
    setSplit(false);
    setSplitMonths("3");
    setSplitType("equal");
    setCustomAmounts(["0.00", "0.00", "0.00"]);
  };

  return (
    <Card className="animate-fade-in border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowDownCircle className="h-5 w-5 text-primary" />
          Add Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g. Salary, Freelance, Dividends"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                required
                disabled={disabled || submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                disabled={disabled || submitting}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)} disabled={disabled || submitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    disabled={disabled || submitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={disabled || submitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:min-w-64">
              <Label htmlFor="new-category">New category</Label>
              <div className="flex gap-2">
                <Input
                  id="new-category"
                  placeholder="e.g. Remote work"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  disabled={disabled || submitting || creatingCategory}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateCategory}
                  disabled={!newCategory.trim() || disabled || submitting || creatingCategory}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Split className="h-4 w-4 text-primary" />
                  <Label htmlFor="split-toggle" className="cursor-pointer">
                    Split Across Months
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">By default, income counts fully in the selected date month.</p>
              </div>
              <Switch id="split-toggle" checked={split} onCheckedChange={setSplit} disabled={disabled || submitting} />
            </div>

            {split && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={splitMonths} onValueChange={setSplitMonths} disabled={disabled || submitting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 6, 9, 12, 18, 24].map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value} months
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Split type</Label>
                    <Select value={splitType} onValueChange={(value) => setSplitType(value as SplitType)} disabled={disabled || submitting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">Equal split</SelectItem>
                        <SelectItem value="custom">Custom unequal split</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {splitType === "equal" ? (
                  <div className="rounded-lg bg-background p-3 text-sm text-muted-foreground">
                    {amount
                      ? `${formatCurrency(numericAmount / monthCount, currency)} average per month`
                      : "Enter an amount to preview the split."}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg bg-background p-3">
                    <div className="grid gap-3">
                      {monthLabels.map((label, index) => (
                        <div key={label} className="grid gap-2 sm:grid-cols-[1fr_160px] sm:items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customAmounts[index] || "0.00"}
                            onChange={(event) => {
                              const next = event.target.value;
                              setCustomAmounts((current) => current.map((item, itemIndex) => (itemIndex === index ? next : item)));
                            }}
                            disabled={disabled || submitting}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">Assigned: {formatCurrency(customTotal, currency)}</span>
                      <span className={cn("font-medium", customSplitValid ? "text-primary" : "text-destructive")}>
                        Target: {formatCurrency(numericAmount, currency)}
                      </span>
                    </div>
                    {!customSplitValid && (
                      <p className="text-sm text-destructive">Custom month amounts must match the total amount exactly.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={disabled || submitting || !customSplitValid}>
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            {submitting ? "Saving..." : "Add Income"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
