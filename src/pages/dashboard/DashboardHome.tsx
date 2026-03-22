import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kpis as mockKpis, revenueVsExpenses } from "@/data/mock-data";
import { DollarSign, Users, Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SyncDataButton } from "@/components/dashboard/SyncDataButton";
import { supabase } from "@/lib/supabase";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const DashboardHome = () => {
  const [metrics, setMetrics] = useState({
    totalSkus: 0,
    lowStock: 0,
    loading: true
  });

  useEffect(() => {
    async function fetchDashboardMetrics() {
      try {
        const { data, error } = await supabase.from('products').select('stock, min_stock');
        if (error) throw error;
        
        if (data) {
          const lowStock = data.filter(p => p.stock < (p.min_stock || 10)).length;
          setMetrics({
            totalSkus: data.length,
            lowStock: lowStock,
            loading: false
          });
        }
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setMetrics(m => ({ ...m, loading: false }));
      }
    }
    fetchDashboardMetrics();
  }, []);

  const kpiCards = [
    { title: "Ingresos del Mes", value: formatMoney(mockKpis.ingresosMes), icon: TrendingUp, color: "text-success" },
    { title: "Gastos del Mes", value: formatMoney(mockKpis.gastosMes), icon: TrendingDown, color: "text-destructive" },
    { title: "Empleados Activos", value: mockKpis.empleadosActivos.toString(), icon: Users, color: "text-info" },
    { 
      title: "SKUs Únicos", 
      value: metrics.loading ? "..." : metrics.totalSkus.toString(), 
      icon: Package, 
      color: "text-primary" 
    },
    { 
      title: "Stock Bajo (Real)", 
      value: metrics.loading ? "..." : metrics.lowStock.toString(), 
      icon: AlertTriangle, 
      color: "text-warning" 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Panel de Control EISEN</h1>
          <p className="text-sm text-muted-foreground">Sincronización híbrida: Supabase + Métricas Operativas</p>
        </div>
        <SyncDataButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="shadow-card border-white/5 bg-card/40 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{kpi.title}</p>
                  <p className="text-2xl font-display font-black tracking-tight">{kpi.value}</p>
                </div>
                {metrics.loading && kpi.title.includes("Real") ? (
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-80`} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="font-display text-lg uppercase font-bold tracking-tight">Historias de Flujo de Caja — 2024</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-10" vertical={false} />
                <XAxis dataKey="month" className="text-xs font-bold uppercase tracking-tighter" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff0000' }}
                  formatter={(value: number) => [formatMoney(value), ""]}
                />
                <Legend iconType="square" />
                <Bar dataKey="ingresos" fill="#d71f1f" radius={[0, 0, 0, 0]} name="Ingresos (Proyectados)" />
                <Bar dataKey="gastos" fill="rgba(255,255,255,0.2)" radius={[0, 0, 0, 0]} name="Gastos Operativos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
