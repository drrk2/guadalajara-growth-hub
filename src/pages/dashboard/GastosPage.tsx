import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { expenseCategories } from "@/data/mock-data";
import { Plus, Search, RefreshCw, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useSystem } from "@/context/SystemContext";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const GastosPage = () => {
  const { expenses, loadingExpenses, addExpense } = useSystem();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loadingExpenses) {
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Cargando Finanzas...</p>
        </div>
    );
  }

  const filtered = expenses.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.provider.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const total = filtered.reduce((a, e) => a + e.amount, 0);

  // Grouping for chart
  const chartData = expenseCategories.map(cat => {
      const value = expenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      return { 
          name: cat, 
          value, 
          color: cat === "Nómina" ? "#D71F1F" : cat === "Servicios" ? "#D1D5DB" : "#333333" 
      };
  }).filter(c => c.value > 0);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newExpense = {
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      amount: Number(fd.get("amount")),
      date: fd.get("date") as string,
      provider: fd.get("provider") as string,
    };

    try {
        await addExpense(newExpense);
        setDialogOpen(false);
        toast({ title: "Gasto registrado", description: `${newExpense.description} — ${formatMoney(newExpense.amount)}` });
    } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el gasto." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Gastos y Finanzas</h1>
          <p className="text-sm text-muted-foreground">Total filtrado: {formatMoney(total)}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 skew-x-[-12deg] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90">
                <span className="skew-x-[12deg] flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Registrar Gasto
                </span>
            </Button>
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
              <div className="space-y-1"><Label>Fecha</Label><Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required /></div>
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
          <SelectTrigger className="w-full sm:w-[180px] text-white"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white">Descripción</TableHead>
                  <TableHead className="text-white">Categoría</TableHead>
                  <TableHead className="text-white">Proveedor</TableHead>
                  <TableHead className="text-right text-white">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((exp) => (
                  <TableRow key={exp.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="text-sm font-mono text-muted-foreground">{exp.date}</TableCell>
                    <TableCell className="text-sm font-bold text-white">{exp.description}</TableCell>
                    <TableCell><span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/50">{exp.category}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.provider}</TableCell>
                    <TableCell className="text-sm text-right font-bold text-primary">{formatMoney(exp.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card border-t-2 border-primary">
          <CardHeader><CardTitle className="font-display text-base text-white">Distribución Real</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatMoney(value)} 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                  />
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
