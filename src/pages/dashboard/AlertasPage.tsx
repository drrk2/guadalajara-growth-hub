import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Bell, Package, ClipboardList,
  Loader2, AlertCircle, CheckCircle2, RefreshCw, ArrowRight,
} from "lucide-react";
import { useAlertsContext, type AppAlert, type AlertSeverity, type AlertType } from "@/context/AlertsContext";

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_STYLE: Record<AlertSeverity, {
  border:  string;
  badge:   string;
  icon:    string;
  label:   string;
}> = {
  alta: {
    border: "border-l-destructive",
    badge:  "bg-destructive/10 text-destructive border-destructive/20",
    icon:   "bg-destructive/10 text-destructive",
    label:  "Alta",
  },
  media: {
    border: "border-l-yellow-500",
    badge:  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon:   "bg-yellow-500/10 text-yellow-500",
    label:  "Media",
  },
  info: {
    border: "border-l-blue-500",
    badge:  "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon:   "bg-blue-500/10 text-blue-500",
    label:  "Info",
  },
};

const TYPE_ICON: Record<AlertType, React.ElementType> = {
  stock_zero:  Package,
  stock_low:   Package,
  quote_nueva: ClipboardList,
};

const TYPE_LABEL: Record<AlertType, string> = {
  stock_zero:  "Sin Stock",
  stock_low:   "Stock Bajo",
  quote_nueva: "Cotización",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const timeAgo = (iso: string): string => {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000)     return "Ahora mismo";
  if (ms < 3_600_000)  return `Hace ${Math.floor(ms / 60_000)} min`;
  if (ms < 86_400_000) return `Hace ${Math.floor(ms / 3_600_000)} h`;
  const days = Math.floor(ms / 86_400_000);
  return `Hace ${days} día${days !== 1 ? "s" : ""}`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: AppAlert }) {
  const navigate = useNavigate();
  const sev      = SEVERITY_STYLE[alert.severity];
  const Icon     = TYPE_ICON[alert.type];

  return (
    <Card className={`shadow-card border-l-4 ${sev.border} bg-card/40`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${sev.icon}`}>
            <Icon className="h-4 w-4" />
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {TYPE_LABEL[alert.type]}
              </span>
              <Badge className={`text-[10px] px-1.5 py-0 border ${sev.badge}`}>
                {sev.label}
              </Badge>
            </div>
            <p className="text-sm font-medium leading-snug">{alert.message}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(alert.createdAt)}</p>
          </div>

          {/* CTA */}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs gap-1 h-8 px-2 self-center"
            onClick={() => navigate(alert.cta.to)}
          >
            {alert.cta.label}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SeveritySection({ title, items }: { title: string; items: AppAlert[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {items.map(a => <AlertCard key={a.id} alert={a} />)}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AlertasPage = () => {
  const { alerts, count, loading, error, reload } = useAlertsContext();

  const alta  = alerts.filter(a => a.severity === "alta");
  const media = alerts.filter(a => a.severity === "media");
  const info  = alerts.filter(a => a.severity === "info");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Centro de Alertas</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Verificando estado del sistema..."
              : error
              ? "No se pudo cargar"
              : count === 0
              ? "Todo en orden — sin alertas activas"
              : `${count} alerta${count !== 1 ? "s" : ""} activa${count !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="h-40 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Consultando Supabase...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-sm">Error al cargar alertas</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && count === 0 && (
        <div className="h-48 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 opacity-40" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-50">Sin alertas activas</p>
          <p className="text-xs opacity-30 max-w-xs">
            No hay productos sin stock, stock bajo ni cotizaciones sin atender.
          </p>
        </div>
      )}

      {/* Alerts grouped by severity */}
      {!loading && !error && count > 0 && (
        <>
          <SeveritySection title="Prioridad Alta" items={alta} />
          {alta.length > 0 && media.length > 0 && <Separator />}
          <SeveritySection title="Prioridad Media" items={media} />
          {(alta.length > 0 || media.length > 0) && info.length > 0 && <Separator />}
          <SeveritySection title="Informativas" items={info} />
        </>
      )}

      {/* Footer note */}
      {!loading && !error && (
        <p className="text-[10px] text-muted-foreground/40 text-center pt-2">
          Alertas calculadas en tiempo real · sin estado persistente
        </p>
      )}
    </div>
  );
};

export default AlertasPage;
