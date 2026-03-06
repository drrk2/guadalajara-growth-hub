import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { revenueVsExpenses, kpis, expensesByCategory } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const AnaliticaPage = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const margin = kpis.ingresosMes - kpis.gastosMes;
  const marginPct = ((margin / kpis.ingresosMes) * 100).toFixed(1);

  const generateAIReport = () => {
    setIsGenerating(true);
    toast({ title: "🤖 Iniciando IA", description: "Analizando datos de ingresos y gastos..." });

    setTimeout(() => {
      toast({ title: "📈 Descubrimiento", description: "Se detectó una oportunidad de ahorro del 15% en insumos." });
    }, 2000);

    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "✅ Reporte Generado",
        description: "El análisis estratégico está listo para descargar.",
        variant: "default",
      });
    }, 4500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Analítica Inteligente</h1>
          <p className="text-sm text-muted-foreground">Métricas, tendencias y predicciones IA para tu negocio</p>
        </div>
        <Button
          variant="secondary"
          className="gap-2 shadow-card"
          disabled={isGenerating}
          onClick={generateAIReport}
        >
          <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
          {isGenerating ? "Generando..." : "Generar Reporte IA"}
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Margen del Mes</p>
                <p className="text-2xl font-display font-bold text-success">{formatMoney(margin)}</p>
                <p className="text-xs text-muted-foreground">{marginPct}% de margen</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Crecimiento vs Mes Anterior</p>
                <p className="text-2xl font-display font-bold text-primary">+11.9%</p>
                <p className="text-xs text-muted-foreground">en ingresos</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Gasto Promedio Diario</p>
                <p className="text-2xl font-display font-bold">{formatMoney(Math.round(kpis.gastosMes / 30))}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Tendencia de Ingresos</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                  <Line type="monotone" dataKey="ingresos" stroke="hsl(152, 55%, 28%)" strokeWidth={2} dot={{ fill: "hsl(152, 55%, 28%)" }} />
                  <Line type="monotone" dataKey="gastos" stroke="hsl(28, 90%, 55%)" strokeWidth={2} dot={{ fill: "hsl(28, 90%, 55%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Distribución de Gastos</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expensesByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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

export default AnaliticaPage;
