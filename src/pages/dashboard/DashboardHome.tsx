import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Package, AlertTriangle, TrendingDown, RefreshCw,
  FileText, CheckCircle, Loader2, AlertCircle, ClipboardList,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const fmtShort = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}k`
    : `$${v}`;

// Returns last 6 months as [{ key: "2026-01", label: "ENE" }, ...]
const lastSixMonths = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key:   d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("es-MX", { month: "short" })
               .replace(".", "")
               .toUpperCase(),
    };
  });
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashData {
  // products
  totalSkus:        number;
  lowStock:         number;
  // quotes
  nuevas:           number;
  ganadas:          number;
  valorCotizadoMes: number;
  // expenses
  gastosMes:        number;
  // employees
  empleadosActivos: number;
  // chart
  chart: { month: string; cotizaciones: number; gastos: number }[];
}

// ── Component ─────────────────────────────────────────────────────────────────

const DashboardHome = () => {
  const [data, setData]       = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Date boundaries (month boundaries are the safest approach with Date API)
    const now           = new Date();
    const monthStartTs  = new Date(now.getFullYear(), now.getMonth(),     1).toISOString();
    const nextMonthTs   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const monthStartDate = monthStartTs.slice(0, 10);  // YYYY-MM-DD for date column
    const nextMonthDate  = nextMonthTs.slice(0, 10);

    const months          = lastSixMonths();
    const sixMonthsAgoTs  = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
    const sixMonthsAgoDate = sixMonthsAgoTs.slice(0, 10);

    try {
      // Run all 8 queries in parallel
      const [
        prodRes,
        nuevasRes,
        ganadasRes,
        quotesMonthRes,
        expMonthRes,
        empleadosRes,
        quotesHistRes,
        expHistRes,
      ] = await Promise.all([
        // products: need stock + min_stock to compare columns (can't do in Supabase filter)
        supabase.from("products").select("stock, min_stock").eq("active", true),

        // quotes counts (global)
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "nueva"),
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "ganada"),

        // this month's quotes total
        supabase.from("quotes").select("total_estimate")
          .gte("created_at", monthStartTs)
          .lt("created_at", nextMonthTs),

        // this month's expenses total (date column → date string filter)
        supabase.from("expenses").select("amount")
          .gte("date", monthStartDate)
          .lt("date", nextMonthDate),

        // active employees count
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "active"),

        // quotes history for chart (last 6 months)
        supabase.from("quotes").select("total_estimate, created_at")
          .gte("created_at", sixMonthsAgoTs),

        // expenses history for chart (last 6 months)
        supabase.from("expenses").select("amount, date")
          .gte("date", sixMonthsAgoDate),
      ]);

      // Surface the first error from any query
      const firstErr = [prodRes, nuevasRes, ganadasRes, quotesMonthRes, expMonthRes, empleadosRes, quotesHistRes, expHistRes]
        .find(r => r.error)?.error;
      if (firstErr) throw firstErr;

      // Safe casts — Supabase returns any[] without generated types
      const prodData       = (prodRes.data          ?? []) as { stock: number; min_stock: number }[];
      const quotesMonth    = (quotesMonthRes.data    ?? []) as { total_estimate: number }[];
      const expMonth       = (expMonthRes.data       ?? []) as { amount: number }[];
      const quotesHist     = (quotesHistRes.data     ?? []) as { total_estimate: number; created_at: string }[];
      const expHist        = (expHistRes.data        ?? []) as { amount: number; date: string }[];

      // Aggregate chart data per month
      const chart = months.map(({ key, label }) => ({
        month:         label,
        cotizaciones:  quotesHist
                         .filter(q => q.created_at.startsWith(key))
                         .reduce((s, q) => s + Number(q.total_estimate), 0),
        gastos:        expHist
                         .filter(e => e.date.startsWith(key))
                         .reduce((s, e) => s + Number(e.amount), 0),
      }));

      setData({
        totalSkus:        prodData.length,
        lowStock:         prodData.filter(p => p.stock <= p.min_stock).length,
        nuevas:           nuevasRes.count      ?? 0,
        ganadas:          ganadasRes.count     ?? 0,
        valorCotizadoMes: quotesMonth.reduce((s, q) => s + Number(q.total_estimate), 0),
        gastosMes:        expMonth.reduce((s, e) => s + Number(e.amount), 0),
        empleadosActivos: empleadosRes.count   ?? 0,
        chart,
      });
    } catch (err) {
      console.error("Dashboard metrics error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar métricas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime: refresh dashboard metrics when any tracked table changes
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(load, 400);
    };

    const ch = supabase
      .channel("dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" },  debounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" },    debounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" },  debounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, debounced)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [load]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Cargando métricas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive opacity-40" />
        <p className="text-sm font-bold uppercase tracking-widest text-destructive/80">{error}</p>
        <Button variant="outline" onClick={load} className="gap-2 mt-2">
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  // ── KPI definitions ────────────────────────────────────────────────────────

  const commercial = [
    {
      title:   "Cotizaciones Nuevas",
      value:   data.nuevas.toString(),
      icon:    ClipboardList,
      color:   "text-yellow-400",
      border:  "border-l-yellow-500",
      sub:     "Pendientes de contacto",
    },
    {
      title:   "Ganadas",
      value:   data.ganadas.toString(),
      icon:    CheckCircle,
      color:   "text-emerald-400",
      border:  "border-l-emerald-500",
      sub:     "Total histórico",
    },
    {
      title:   "Valor Cotizado (Mes)",
      value:   fmt(data.valorCotizadoMes),
      icon:    FileText,
      color:   "text-primary",
      border:  "border-l-primary",
      sub:     "Este mes",
    },
  ];

  const operations = [
    {
      title:   "Gastos del Mes",
      value:   fmt(data.gastosMes),
      icon:    TrendingDown,
      color:   "text-destructive",
      border:  "border-l-destructive",
      sub:     "Gastos registrados",
    },
    {
      title:   "SKUs Activos",
      value:   data.totalSkus.toString(),
      icon:    Package,
      color:   "text-primary",
      border:  "border-l-primary",
      sub:     "En catálogo",
    },
    {
      title:   "Stock Bajo",
      value:   data.lowStock.toString(),
      icon:    AlertTriangle,
      color:   data.lowStock > 0 ? "text-warning" : "text-emerald-400",
      border:  data.lowStock > 0 ? "border-l-yellow-500" : "border-l-emerald-500",
      sub:     "stock ≤ mínimo",
    },
    {
      title:   "Empleados Activos",
      value:   data.empleadosActivos.toString(),
      icon:    Users,
      color:   "text-info",
      border:  "border-l-blue-500",
      sub:     "En plantilla",
    },
  ];

  const chartIsEmpty = data.chart.every(d => d.cotizaciones === 0 && d.gastos === 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Panel de Control EISEN</h1>
          <p className="text-sm text-muted-foreground">Métricas en tiempo real desde Supabase</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* ── KPIs Comerciales ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Comercial
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {commercial.map(k => (
            <Card key={k.title} className={`shadow-card border-l-4 ${k.border} bg-card/40 backdrop-blur-sm`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      {k.title}
                    </p>
                    <p className="text-2xl font-display font-black tracking-tight truncate">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
                  </div>
                  <k.icon className={`h-8 w-8 flex-shrink-0 ml-2 mt-0.5 ${k.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── KPIs Operativos ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Operaciones
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {operations.map(k => (
            <Card key={k.title} className={`shadow-card border-l-4 ${k.border} bg-card/40 backdrop-blur-sm`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      {k.title}
                    </p>
                    <p className="text-2xl font-display font-black tracking-tight truncate">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
                  </div>
                  <k.icon className={`h-7 w-7 flex-shrink-0 ml-2 mt-0.5 ${k.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <Card className="shadow-card border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="font-display text-lg uppercase font-bold tracking-tight">
            Cotizaciones vs. Gastos — Últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {chartIsEmpty ? (
            <div className="h-[350px] flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <FileText className="h-12 w-12 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">
                Sin datos aún
              </p>
              <p className="text-xs opacity-30 max-w-xs">
                Los datos aparecerán conforme registres cotizaciones y gastos.
              </p>
            </div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-10" vertical={false} />
                  <XAxis
                    dataKey="month"
                    className="text-xs font-bold uppercase tracking-tighter"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={fmtShort}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    width={55}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 0,
                    }}
                    labelStyle={{ fontWeight: "bold", marginBottom: 4, color: "#fff" }}
                    formatter={(value: number) => [fmt(value), ""]}
                  />
                  <Legend iconType="square" />
                  <Bar
                    dataKey="cotizaciones"
                    fill="#d71f1f"
                    radius={[0, 0, 0, 0]}
                    name="Cotizaciones"
                  />
                  <Bar
                    dataKey="gastos"
                    fill="rgba(255,255,255,0.2)"
                    radius={[0, 0, 0, 0]}
                    name="Gastos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
