import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface YearlySummaryProps {
  data: { year: string; total: number }[];
  currency: string;
}

export default function YearlySummary({ data, currency }: YearlySummaryProps) {
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
          <p className="py-4 text-center text-muted-foreground">No data yet for {currency}.</p>
        ) : (
          <div className="space-y-3">
            {data.map((year) => (
              <div key={year.year} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-2xl font-bold">{year.year}</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(year.total, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
