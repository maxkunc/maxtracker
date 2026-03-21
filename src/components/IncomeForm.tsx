import { useEffect, useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { ArrowDownCircle, CalendarIcon, Coins, EqualNot, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { currencyOptions, formatCurrency } from "@/lib/currency";
import type { IncomeEntry } from "@/lib/income";

interface IncomeFormProps {
  onAdd: (entry: Omit<IncomeEntry, "id" | "createdAt">) => void;
}

function getEqualPreview(total: number, months: number) {
  if (!total || months <= 0) {
    return Array.from({ length: months }, () => "0.00");
  }

  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / months);
  const remainder = totalCents - base * months;

  return Array.from({ length: months }, (_, index) => ((base + (index === months - 1 ? remainder : 0)) / 100).toFixed(2));
}

export default function IncomeForm({ onAdd }: IncomeFormProps) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState<Date>();
  const [split, setSplit] = useState(false);
  const [splitMonths, setSplitMonths] = useState("3");
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [customAmounts, setCustomAmounts] = useState<string[]>(["0.00", "0.00", "0.00"]);

  const monthCount = parseInt(splitMonths, 10);
  const numericAmount = parseFloat(amount || "0");

  useEffect(() => {
    if (split && splitType === "custom") {
      setCustomAmounts(getEqualPreview(numericAmount, monthCount));
    }
  }, [split, splitType, monthCount, numericAmount]);

  const monthLabels = useMemo(() => {
    return Array.from({ length: monthCount }, (_, index) => {
      const currentDate = date ? addMonths(date, index) : null;
      return currentDate ? format(currentDate, "MMM yyyy") : `Month ${index + 1}`;
    });
  }, [date, monthCount]);

  const customTotal = customAmounts.reduce((sum, value) => sum + (parseFloat(value || "0") || 0), 0);
  const customSplitValid = !split || splitType === "equal" || Math.abs(customTotal - numericAmount) < 0.01;

  const handleCustomAmountChange = (index: number, value: string) => {
    setCustomAmounts((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!source || !amount || !date || !customSplitValid) {
      return;
    }

    onAdd({
      source,
      amount: numericAmount,
      currency,
      startDate: date.toISOString(),
      splitMonths: split ? monthCount : 1,
      splitType: split ? splitType : "equal",
      monthlyAmounts: split && splitType === "custom"
        ? customAmounts.map((value) => Number(parseFloat(value || "0").toFixed(2)))
        : undefined,
    });

    setSource("");
    setAmount("");
    setCurrency("USD");
    setDate(undefined);
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
                placeholder="e.g. Salary, Contract, Rent"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                required
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
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
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
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
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

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Split className="h-4 w-4 text-primary" />
                  <Label htmlFor="split-toggle" className="cursor-pointer">
                    Split Across Months
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Default is full income in the start month.
                </p>
              </div>
              <Switch id="split-toggle" checked={split} onCheckedChange={setSplit} />
            </div>

            {split && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={splitMonths} onValueChange={setSplitMonths}>
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
                    <Label>Split Type</Label>
                    <Select value={splitType} onValueChange={(value: "equal" | "custom") => setSplitType(value)}>
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
                  <div className="rounded-lg bg-background p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="h-4 w-4 text-primary" />
                      {amount
                        ? `${formatCurrency(numericAmount / monthCount, currency)} average per month`
                        : "Enter an amount to preview the monthly split."}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg bg-background p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <EqualNot className="h-4 w-4 text-primary" />
                      Customize each month
                    </div>

                    <div className="grid gap-3">
                      {monthLabels.map((label, index) => (
                        <div key={label} className="grid gap-2 sm:grid-cols-[1fr_180px] sm:items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customAmounts[index] || "0.00"}
                            onChange={(event) => handleCustomAmountChange(index, event.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">
                        Assigned total: {formatCurrency(customTotal, currency)}
                      </span>
                      <span className={cn("font-medium", customSplitValid ? "text-success" : "text-destructive")}>
                        Target: {formatCurrency(numericAmount, currency)}
                      </span>
                    </div>
                    {!customSplitValid && (
                      <p className="text-sm text-destructive">
                        Custom month amounts must add up exactly to the total income.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!customSplitValid}>
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Add Income
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
