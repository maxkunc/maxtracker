import { useState } from "react";
import { format } from "date-fns";
import { Check, FileText, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { IncomeEntry } from "@/lib/income";

interface TransactionLogProps {
  entries: IncomeEntry[];
  onUpdate: (id: string, data: Partial<Omit<IncomeEntry, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}

export default function TransactionLog({ entries, onUpdate, onDelete }: TransactionLogProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const startEdit = (entry: IncomeEntry) => {
    setEditId(entry.id);
    setEditSource(entry.source);
    setEditAmount(String(entry.amount));
  };

  const confirmEdit = () => {
    if (editId && editSource && editAmount) {
      onUpdate(editId, { source: editSource, amount: parseFloat(editAmount) });
      setEditId(null);
    }
  };

  const sorted = [...entries].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <Card className="animate-fade-in border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Transaction Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No transactions recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Split</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {editId === entry.id ? (
                      <Input value={editSource} onChange={(event) => setEditSource(event.target.value)} className="h-8 min-w-28" />
                    ) : (
                      <div className="min-w-36">
                        <span className="font-medium">{entry.source}</span>
                        <p className="text-xs text-muted-foreground">{entry.currency}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editId === entry.id ? (
                      <Input type="number" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} className="h-8 w-28" />
                    ) : (
                      <span className="font-semibold text-primary">{formatCurrency(entry.amount, entry.currency)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(entry.startDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {entry.splitMonths > 1 ? (
                      <Badge variant="secondary">
                        {entry.splitType === "custom" ? `Custom ${entry.splitMonths}m` : `${entry.splitMonths} months`}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editId === entry.id ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={confirmEdit}>
                          <Check className="h-4 w-4 text-success" />
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
