import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

interface YearlySummaryProps {
  currency: CurrencyCode;
  data: Array<{ total: number; year: string }>;
}

export default function YearlySummary({ currency, data }: YearlySummaryProps) {
  return (
    <Card className="animate-fade-in border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Yearly Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">No annual totals match the current filters.</p>
        ) : (
          <div className="space-y-3">
            {data.map((year) => (
              <div key={year.year} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 p-4">
                <span className="text-2xl font-bold tracking-tight">{year.year}</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(year.total, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
