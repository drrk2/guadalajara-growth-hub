import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertSeverity = "alta" | "media" | "info";
export type AlertType     = "stock_zero" | "stock_low" | "quote_nueva";

export interface AppAlert {
  id:        string;
  type:      AlertType;
  severity:  AlertSeverity;
  message:   string;
  createdAt: string; // ISO — for quotes: quote creation time; for stock: detection time
  cta:       { label: string; to: string };
}

interface AlertsContextValue {
  alerts:  AppAlert[];
  count:   number;
  loading: boolean;
  error:   string | null;
  reload:  () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AlertsContext = createContext<AlertsContextValue>({
  alerts:  [],
  count:   0,
  loading: true,
  error:   null,
  reload:  () => {},
});

export const useAlertsContext = () => useContext(AlertsContext);

// ── Constants ─────────────────────────────────────────────────────────────────

const MS_24H = 24 * 60 * 60 * 1000;
const MS_48H = 48 * 60 * 60 * 1000;

const SEVERITY_ORDER: Record<AlertSeverity, number> = { alta: 0, media: 1, info: 2 };

// ── Provider ──────────────────────────────────────────────────────────────────

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts]   = useState<AppAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [prodRes, quotesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, sku, stock, min_stock")
          .eq("active", true),
        supabase
          .from("quotes")
          .select("id, created_at, customers(name)")
          .eq("status", "nueva")
          .order("created_at", { ascending: true }),
      ]);

      if (prodRes.error)   throw prodRes.error;
      if (quotesRes.error) throw quotesRes.error;

      type ProdRow  = { id: string; name: string; sku: string; stock: number; min_stock: number };
      // Supabase infers join columns as arrays without generated types → cast via unknown
      type QuoteRow = { id: string; created_at: string; customers: { name: string }[] | { name: string } | null };

      const prodData   = (prodRes.data   ?? []) as ProdRow[];
      const quotesData = (quotesRes.data ?? []) as unknown as QuoteRow[];

      const result: AppAlert[] = [];
      const now = new Date();

      // ── Product alerts ───────────────────────────────────────────────────────
      for (const p of prodData) {
        if (p.stock === 0) {
          result.push({
            id:        `stock_zero_${p.id}`,
            type:      "stock_zero",
            severity:  "alta",
            message:   `${p.name} (${p.sku}): sin stock — 0 unidades disponibles`,
            createdAt: now.toISOString(),
            cta:       { label: "Ver Inventario", to: "/dashboard/inventario" },
          });
        } else if (p.min_stock > 0 && p.stock <= p.min_stock) {
          result.push({
            id:        `stock_low_${p.id}`,
            type:      "stock_low",
            severity:  "media",
            message:   `${p.name} (${p.sku}): stock bajo — ${p.stock} ud. (mínimo ${p.min_stock})`,
            createdAt: now.toISOString(),
            cta:       { label: "Ver Inventario", to: "/dashboard/inventario" },
          });
        }
      }

      // ── Quote alerts ─────────────────────────────────────────────────────────
      for (const q of quotesData) {
        const age  = now.getTime() - new Date(q.created_at).getTime();
        const raw  = q.customers;
        const customerName = Array.isArray(raw)
          ? (raw[0]?.name ?? "Cliente desconocido")
          : (raw?.name     ?? "Cliente desconocido");

        let severity:  AlertSeverity;
        let timeLabel: string;

        if (age >= MS_48H) {
          const days = Math.floor(age / MS_24H);
          severity  = "alta";
          timeLabel = `${days} día${days !== 1 ? "s" : ""} sin respuesta`;
        } else if (age >= MS_24H) {
          severity  = "media";
          timeLabel = "más de 24 h sin atender";
        } else {
          severity  = "info";
          timeLabel = "recibida hace menos de 24 h";
        }

        result.push({
          id:        `quote_nueva_${q.id}`,
          type:      "quote_nueva",
          severity,
          message:   `Cotización de ${customerName} — ${timeLabel}`,
          createdAt: q.created_at,
          cta:       { label: "Ver Cotizaciones", to: "/dashboard/cotizaciones" },
        });
      }

      // Sort: alta → media → info; within severity, oldest first
      result.sort((a, b) => {
        const diff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (diff !== 0) return diff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setAlerts(result);
    } catch (err) {
      console.error("AlertsContext error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar alertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime: invalidate when products or quotes change
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(load, 400);
    };

    const ch1 = supabase
      .channel("alerts-rt-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, debounced)
      .subscribe();

    const ch2 = supabase
      .channel("alerts-rt-quotes")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, debounced)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [load]);

  return (
    <AlertsContext.Provider value={{ alerts, count: alerts.length, loading, error, reload: load }}>
      {children}
    </AlertsContext.Provider>
  );
}
