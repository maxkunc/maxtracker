import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Check, FileText, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/currency";
import type { IncomeEntry } from "@/lib/income";

interface TransactionLogProps {
  categoryNames: Record<string, string>;
  entries: IncomeEntry[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: { amount?: number; source?: string }) => Promise<void>;
}

export default function TransactionLog({ categoryNames, entries, onDelete, onUpdate }: TransactionLogProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries],
  );

  const startEdit = (entry: IncomeEntry) => {
    setEditId(entry.id);
    setEditSource(entry.source);
    setEditAmount(String(entry.amount));
  };

  const confirmEdit = async () => {
    if (!editId || !editSource.trim() || !editAmount) {
      return;
    }

    await onUpdate(editId, {
      amount: parseFloat(editAmount),
      source: editSource.trim(),
    });
    setEditId(null);
  };

  return (
    <Card className="animate-fade-in border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Transaction Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEntries.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No transactions match the current filters.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Split</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {editId === entry.id ? (
                      <Input value={editSource} onChange={(event) => setEditSource(event.target.value)} className="h-8 min-w-28" />
                    ) : (
                      <div className="min-w-36">
                        <span className="font-medium">{entry.source}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.category_id ? categoryNames[entry.category_id] || "Unknown" : "Uncategorized"}</Badge>
                  </TableCell>
                  <TableCell>
                    {editId === entry.id ? (
                      <Input type="number" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} className="h-8 w-28" />
                    ) : (
                      <span className="font-semibold text-primary">{formatCurrency(entry.amount, DEFAULT_CURRENCY)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(`${entry.date}T00:00:00`), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {entry.split_months > 1 ? (
                      <Badge variant="outline">{entry.split_type === "custom" ? `Custom ${entry.split_months}m` : `${entry.split_months} months`}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editId === entry.id ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={confirmEdit}>
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
