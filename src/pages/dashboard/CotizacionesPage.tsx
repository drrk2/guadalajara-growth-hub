import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw, MessageSquare, FileText, ChevronRight,
  Package, AlertCircle, XCircle, Trash2, Loader2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

// ─── Types ───────────────────────────────────────────────────────────────────

type QuoteStatus  = "nueva" | "contactada" | "enviada" | "ganada" | "perdida";
type StatusFilter = QuoteStatus | "all";

interface QuoteCustomer {
  id: string;
  name: string;
  phone: string;
  company: string | null;
}

interface QuoteItem {
  id: string;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

// quote_items are NOT fetched in the list query — loaded on demand when opening detail
interface Quote {
  id: string;
  status: QuoteStatus;
  total_estimate: number;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  delivery_type: "delivery" | "pickup" | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_zip: string | null;
  delivery_notes: string | null;
  customers: QuoteCustomer;
}

interface Kpis {
  total: number;
  nuevas: number;
  ganadas: number;
  totalGanado: number;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<QuoteStatus, { label: string; cls: string }> = {
  nueva:      { label: "Nueva",      cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  contactada: { label: "Contactada", cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  enviada:    { label: "Enviada",    cls: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  ganada:     { label: "Ganada",     cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  perdida:    { label: "Perdida",    cls: "bg-red-500/10 text-red-400 border border-red-500/20" },
};

const STATUS_ORDER: QuoteStatus[] = ["nueva", "contactada", "enviada", "ganada", "perdida"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

const phoneForWa = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `52${digits}` : digits;
};

// ─── Component ────────────────────────────────────────────────────────────────

const CotizacionesPage = () => {
  const { toast } = useToast();

  // list state
  const [quotes, setQuotes]             = useState<Quote[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [totalCount, setTotalCount]     = useState(0);
  const [page, setPage]                 = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kpis, setKpis]                 = useState<Kpis>({ total: 0, nuevas: 0, ganadas: 0, totalGanado: 0 });

  // detail state (items loaded lazily)
  const [detail, setDetail]             = useState<Quote | null>(null);
  const [detailItems, setDetailItems]   = useState<QuoteItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // action state
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Quote | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ── KPI fetch (global — not affected by page/filter) ──────────────────────

  const fetchKpis = useCallback(async () => {
    const [totalRes, nuevasRes, ganadaRes] = await Promise.all([
      supabase.from("quotes").select("id", { count: "exact", head: true }),
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "nueva"),
      supabase.from("quotes").select("total_estimate").eq("status", "ganada"),
    ]);
    const ganadaData = (ganadaRes.data ?? []) as { total_estimate: number }[];
    setKpis({
      total:       totalRes.count  ?? 0,
      nuevas:      nuevasRes.count ?? 0,
      ganadas:     ganadaData.length,
      totalGanado: ganadaData.reduce((s, q) => s + Number(q.total_estimate), 0),
    });
  }, []);

  // ── List fetch (paginated + filtered) ─────────────────────────────────────

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let query = supabase
        .from("quotes")
        .select(
          `id, status, total_estimate, notes, admin_notes, created_at, updated_at,
           delivery_type, delivery_address, delivery_city, delivery_zip, delivery_notes,
           customers ( id, name, phone, company )`,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setQuotes((data as unknown as Quote[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      const msg = err instanceof Error ? err.message : "No se pudieron cargar las cotizaciones.";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => { fetchKpis();  }, [fetchKpis]);

  // Ref that always holds the current detail without staling the RT closure
  const detailRef = useRef<Quote | null>(null);
  useEffect(() => { detailRef.current = detail; }, [detail]);

  // Realtime: refresh list/KPIs when quotes or quote_items change; auto-close deleted detail
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handleChange = (payload: { eventType: string; old?: { id?: string } }) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fetchQuotes();
        fetchKpis();
        if (
          payload.eventType === "DELETE" &&
          detailRef.current &&
          payload.old?.id === detailRef.current.id
        ) {
          setDetail(null);
          setDetailItems([]);
        }
      }, 400);
    };

    const ch = supabase
      .channel("cotizaciones-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" },      handleChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_items" }, handleChange)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [fetchQuotes, fetchKpis]);

  // ── Detail: lazy load items ────────────────────────────────────────────────

  const openDetail = async (q: Quote) => {
    setDetail(q);
    setDetailItems([]);
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from("quote_items")
        .select("id, product_name, product_sku, unit_price, quantity, subtotal")
        .eq("quote_id", q.id);
      if (error) throw error;
      setDetailItems((data as QuoteItem[]) ?? []);
    } catch (err) {
      console.error("Error loading items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  // ── Status update ──────────────────────────────────────────────────────────

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    setUpdatingId(quoteId);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: newStatus })
        .eq("id", quoteId);
      if (error) throw error;

      const patch = (q: Quote) => q.id === quoteId ? { ...q, status: newStatus } : q;
      setQuotes(prev => prev.map(patch));
      setDetail(prev => prev ? patch(prev) : prev);
      toast({ title: "Estatus actualizado", description: STATUS[newStatus].label });
      fetchKpis();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ variant: "destructive", title: "Error al actualizar", description: msg });
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const quoteId    = confirmDelete.id;
    const customerId = confirmDelete.customers.id;

    try {
      // Delete quote — quote_items cascade automatically via FK
      const { error: delErr } = await supabase.from("quotes").delete().eq("id", quoteId);
      if (delErr) throw delErr;

      // Check if this customer has any remaining quotes
      const { count: remaining, error: cntErr } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId);
      if (cntErr) throw cntErr;

      // Orphaned customer → delete to keep data clean
      if (remaining === 0) {
        const { error: custErr } = await supabase.from("customers").delete().eq("id", customerId);
        if (custErr) console.warn("Could not delete orphaned customer:", custErr.message);
      }

      if (detail?.id === quoteId) setDetail(null);
      setConfirmDelete(null);
      toast({ title: "Cotización eliminada", description: "Se eliminó correctamente." });
      fetchQuotes();
      fetchKpis();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ variant: "destructive", title: "Error al eliminar", description: msg });
    } finally {
      setDeleting(false);
    }
  };

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  const openWhatsApp = (q: Quote) => {
    const { name, phone, company } = q.customers;
    const empresa = company ? ` de ${company}` : "";
    let deliveryCtx = "";
    if (q.delivery_type === "delivery") {
      const parts = [q.delivery_city, q.delivery_address].filter(Boolean).join(", ");
      deliveryCtx = ` Solicitó envío a domicilio${parts ? ` (${parts})` : ""}.`;
    } else if (q.delivery_type === "pickup") {
      deliveryCtx = " Recogerá en sucursal.";
    }
    const msg = encodeURIComponent(
      `Hola ${name}${empresa}, soy de *EISEN Industrial*. ` +
      `Recibimos tu solicitud de cotización por ${fmt(q.total_estimate)}.${deliveryCtx} ` +
      `¿Cuándo podemos hablar para enviarte la propuesta formal?`,
    );
    window.open(`https://wa.me/${phoneForWa(phone)}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  // ── Initial load state ─────────────────────────────────────────────────────

  if (loading && quotes.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Cargando cotizaciones...</p>
      </div>
    );
  }

  if (fetchError && quotes.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive opacity-40" />
        <p className="text-sm font-bold uppercase tracking-widest text-destructive/80">{fetchError}</p>
        <Button variant="outline" onClick={fetchQuotes} className="gap-2 mt-2">
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages    = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rangeStart    = page * PAGE_SIZE + 1;
  const rangeEnd      = Math.min((page + 1) * PAGE_SIZE, totalCount);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} solicitudes
            {statusFilter !== "all" && ` · ${STATUS[statusFilter].label}`}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap self-start">
          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={val => {
              setStatusFilter(val as StatusFilter);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[175px] text-xs font-bold uppercase tracking-widest h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest">
                Todos los estatus
              </SelectItem>
              {STATUS_ORDER.map(s => (
                <SelectItem key={s} value={s} className="text-xs font-bold uppercase tracking-widest">
                  {STATUS[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchQuotes(); fetchKpis(); }}
            disabled={loading}
            className="gap-2 h-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── KPIs (global — not page-filtered) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",         value: kpis.total,              cls: "border-l-white/20",   valCls: "" },
          { label: "Sin contactar", value: kpis.nuevas,             cls: "border-l-yellow-500", valCls: "text-yellow-400" },
          { label: "Ganadas",       value: kpis.ganadas,            cls: "border-l-emerald-500",valCls: "text-emerald-400" },
          { label: "Valor ganado",  value: fmt(kpis.totalGanado),   cls: "border-l-primary",    valCls: "text-primary text-base" },
        ].map(k => (
          <Card key={k.label} className={`shadow-card border-l-4 ${k.cls} bg-card/40 backdrop-blur-sm`}>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-black mt-0.5 ${k.valCls}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Content area (loading overlay on pagination/filter change) ── */}
      <div className={loading ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>

        {/* ── Empty ── */}
        {quotes.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <FileText className="h-16 w-16 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">
                {statusFilter !== "all"
                  ? `No hay cotizaciones con estatus "${STATUS[statusFilter].label}"`
                  : "No hay cotizaciones todavía"
                }
              </p>
              {statusFilter !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStatusFilter("all"); setPage(0); }}
                >
                  Ver todas
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Table ── */}
        {quotes.length > 0 && (
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Cliente</TableHead>
                    <TableHead className="font-bold hidden md:table-cell">Empresa</TableHead>
                    <TableHead className="font-bold text-right">Total Est.</TableHead>
                    <TableHead className="font-bold">Estatus</TableHead>
                    <TableHead className="font-bold hidden lg:table-cell">Fecha</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map(q => {
                    const cfg = STATUS[q.status];
                    const isUpdating = updatingId === q.id;
                    return (
                      <TableRow key={q.id} className="hover:bg-muted/20 transition-colors">

                        {/* Cliente */}
                        <TableCell>
                          <p className="font-bold text-sm leading-tight">{q.customers.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{q.customers.phone}</p>
                        </TableCell>

                        {/* Empresa */}
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {q.customers.company || <span className="opacity-25">—</span>}
                        </TableCell>

                        {/* Total */}
                        <TableCell className="text-right font-bold font-mono text-sm">
                          {fmt(q.total_estimate)}
                        </TableCell>

                        {/* Estatus */}
                        <TableCell>
                          <Select
                            value={q.status}
                            onValueChange={val => handleStatusChange(q.id, val as QuoteStatus)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger
                              className={`h-7 w-[130px] text-[10px] font-bold uppercase tracking-widest border-0 ${cfg.cls} ${isUpdating ? "opacity-50" : ""}`}
                            >
                              {isUpdating
                                ? <RefreshCw className="h-3 w-3 animate-spin mx-auto" />
                                : <SelectValue />
                              }
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_ORDER.map(s => (
                                <SelectItem key={s} value={s} className="text-xs font-bold uppercase tracking-widest">
                                  {STATUS[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell className="hidden lg:table-cell text-[11px] text-muted-foreground font-mono">
                          {fmtDate(q.created_at)}
                        </TableCell>

                        {/* Acciones */}
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-emerald-400"
                              title="Abrir WhatsApp"
                              onClick={() => openWhatsApp(q)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-primary"
                              title="Ver detalle"
                              onClick={() => openDetail(q)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>

                            {/* Cancel — only when not already perdida */}
                            {q.status !== "perdida" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-orange-400"
                                title="Cancelar cotización"
                                onClick={() => handleStatusChange(q.id, "perdida")}
                                disabled={isUpdating}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-destructive"
                              title="Eliminar cotización"
                              onClick={() => setConfirmDelete(q)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  {rangeStart}–{rangeEnd} de {totalCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}>
        {detail && (
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display font-black uppercase tracking-tight text-lg">
                Detalle de Cotización
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-1">

              {/* Customer */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Cliente</p>
                  <p className="font-bold">{detail.customers.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Teléfono</p>
                  <p className="font-mono">{detail.customers.phone}</p>
                </div>
                {detail.customers.company && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Empresa</p>
                    <p>{detail.customers.company}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Fecha</p>
                  <p className="text-xs font-mono">{fmtDate(detail.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Estatus</p>
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS[detail.status].cls}`}>
                    {STATUS[detail.status].label}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Productos
                </p>
                {loadingItems ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando productos...
                  </div>
                ) : detailItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin ítems registrados.</p>
                ) : (
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {detailItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b border-muted/20 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{item.product_name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {item.product_sku} · ×{item.quantity} · {fmt(item.unit_price)} c/u
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold font-mono ml-3 flex-shrink-0">{fmt(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery info */}
              {detail.delivery_type && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Entrega
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Tipo</p>
                        <p className="font-bold">
                          {detail.delivery_type === "delivery" ? "📦 Envío a domicilio" : "🏪 Recoger en sucursal"}
                        </p>
                      </div>
                      {detail.delivery_type === "delivery" && (
                        <>
                          {detail.delivery_city && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Ciudad</p>
                              <p>{detail.delivery_city}</p>
                            </div>
                          )}
                          {detail.delivery_zip && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">C.P.</p>
                              <p className="font-mono">{detail.delivery_zip}</p>
                            </div>
                          )}
                          {detail.delivery_address && (
                            <div className="col-span-2">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Dirección</p>
                              <p>{detail.delivery_address}</p>
                            </div>
                          )}
                        </>
                      )}
                      {detail.delivery_notes && (
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Notas</p>
                          <p className="text-muted-foreground text-xs">{detail.delivery_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Estimado</p>
                <p className="text-2xl font-display font-black text-primary">{fmt(detail.total_estimate)}</p>
              </div>

              {/* Actions row 1: status + WhatsApp */}
              <div className="flex gap-3 pt-1">
                <Select
                  value={detail.status}
                  onValueChange={val => handleStatusChange(detail.id, val as QuoteStatus)}
                  disabled={updatingId === detail.id}
                >
                  <SelectTrigger className="flex-1 h-10 text-xs font-bold uppercase tracking-widest">
                    {updatingId === detail.id
                      ? <RefreshCw className="h-3 w-3 animate-spin mx-auto" />
                      : <SelectValue />
                    }
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map(s => (
                      <SelectItem key={s} value={s} className="text-xs font-bold uppercase tracking-widest">
                        {STATUS[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => openWhatsApp(detail)}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>

              {/* Actions row 2: cancel + delete */}
              <div className="flex gap-2">
                {detail.status !== "perdida" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1 text-orange-500 border-orange-500/30 hover:bg-orange-500/10 font-bold"
                    onClick={() => handleStatusChange(detail.id, "perdida")}
                    disabled={updatingId === detail.id}
                  >
                    <XCircle className="h-4 w-4" /> Cancelar cotización
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 font-bold"
                  onClick={() => { setConfirmDelete(detail); setDetail(null); }}
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Confirm Delete Dialog ── */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={open => { if (!open && !deleting) setConfirmDelete(null); }}
      >
        {confirmDelete && (
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Eliminar cotización
              </DialogTitle>
              <DialogDescription className="pt-1">
                Esta acción eliminará la cotización de{" "}
                <strong>{confirmDelete.customers.name}</strong> y sus productos
                cotizados. No se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
                {deleting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</>
                  : <><Trash2 className="h-4 w-4" /> Eliminar</>
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default CotizacionesPage;
