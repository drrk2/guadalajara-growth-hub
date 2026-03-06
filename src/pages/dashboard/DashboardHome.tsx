import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kpis, revenueVsExpenses } from "@/data/mock-data";
import { DollarSign, Users, Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const kpiCards = [
  { title: "Ingresos del Mes", value: formatMoney(kpis.ingresosMes), icon: TrendingUp, color: "text-success" },
  { title: "Gastos del Mes", value: formatMoney(kpis.gastosMes), icon: TrendingDown, color: "text-destructive" },
  { title: "Empleados Activos", value: kpis.empleadosActivos.toString(), icon: Users, color: "text-info" },
  { title: "Stock Bajo", value: kpis.productosStockBajo.toString(), icon: Package, color: "text-warning" },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-2xl font-display font-bold">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Ingresos vs Gastos — Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Legend />
                <Bar dataKey="ingresos" fill="hsl(152, 55%, 28%)" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill="hsl(28, 90%, 55%)" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
