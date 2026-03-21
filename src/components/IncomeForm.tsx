import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IncomeEntry } from "@/lib/income";

interface IncomeFormProps {
  onAdd: (entry: Omit<IncomeEntry, "id" | "createdAt">) => void;
}

export default function IncomeForm({ onAdd }: IncomeFormProps) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>();
  const [split, setSplit] = useState(false);
  const [splitMonths, setSplitMonths] = useState("3");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !amount || !date) return;

    onAdd({
      source,
      amount: parseFloat(amount),
      startDate: date.toISOString(),
      splitMonths: split ? parseInt(splitMonths) : 1,
    });

    setSource("");
    setAmount("");
    setDate(undefined);
    setSplit(false);
    setSplitMonths("3");
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="h-5 w-5 text-primary" />
          Add Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g. Freelance, Salary"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
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

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-2">
              <Split className="h-4 w-4 text-primary" />
              <Label htmlFor="split-toggle" className="cursor-pointer">
                Split Across Months
              </Label>
            </div>
            <Switch id="split-toggle" checked={split} onCheckedChange={setSplit} />
          </div>

          {split && (
            <div className="space-y-2 animate-fade-in">
              <Label>Duration</Label>
              <Select value={splitMonths} onValueChange={setSplitMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 6, 9, 12, 18, 24].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} months
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {amount && (
                <p className="text-sm text-muted-foreground">
                  ≈ ${(parseFloat(amount || "0") / parseInt(splitMonths)).toFixed(2)}/month
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
