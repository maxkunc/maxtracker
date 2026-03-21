import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface YearlySummaryProps {
  data: { year: string; total: number }[];
}

export default function YearlySummary({ data }: YearlySummaryProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Yearly Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {data.map((y) => (
              <div key={y.year} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-2xl font-bold">{y.year}</span>
                <span className="text-xl font-bold text-primary">${y.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
