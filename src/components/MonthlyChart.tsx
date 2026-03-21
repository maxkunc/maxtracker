import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

interface MonthlyChartProps {
  currency: CurrencyCode;
  data: Array<{ label: string; month: string; total: number }>;
}

export default function MonthlyChart({ currency, data }: MonthlyChartProps) {
  return (
    <Card className="animate-fade-in border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Monthly Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No income found for the current filters.</p>
        ) : (
          <div className="space-y-2">
            {data.map((month) => (
              <div key={month.month} className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-muted/50">
                <span className="text-sm font-medium">{month.label}</span>
                <span className="text-sm font-semibold text-primary">{formatCurrency(month.total, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
