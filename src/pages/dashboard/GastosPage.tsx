import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { expenses as mockExpenses, expenseCategories, expensesByCategory } from "@/data/mock-data";
import { Plus, Search } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const GastosPage = () => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState(mockExpenses);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = expenses.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.provider.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const total = filtered.reduce((a, e) => a + e.amount, 0);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newExpense = {
      id: Date.now().toString(),
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      amount: Number(fd.get("amount")),
      date: fd.get("date") as string,
      provider: fd.get("provider") as string,
    };
    setExpenses([newExpense, ...expenses]);
    setDialogOpen(false);
    toast({ title: "Gasto registrado", description: `${newExpense.description} — ${formatMoney(newExpense.amount)}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Gastos y Finanzas</h1>
          <p className="text-sm text-muted-foreground">Total filtrado: {formatMoney(total)}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Registrar Gasto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Nuevo Gasto</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1"><Label>Descripción</Label><Input name="description" required /></div>
              <div className="space-y-1"><Label>Monto</Label><Input name="amount" type="number" step="0.01" required /></div>
              <div className="space-y-1"><Label>Categoría</Label>
                <select name="category" className="w-full px-3 py-2 rounded-md border bg-background text-sm" required>
                  {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label>Proveedor</Label><Input name="provider" required /></div>
              <div className="space-y-1"><Label>Fecha</Label><Input name="date" type="date" defaultValue="2026-03-06" required /></div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por descripción o proveedor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="text-sm">{exp.date}</TableCell>
                    <TableCell className="text-sm font-medium">{exp.description}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{exp.category}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.provider}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{formatMoney(exp.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Gastos por Categoría</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expensesByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GastosPage;
