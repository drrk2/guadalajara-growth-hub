import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search, RefreshCw, AlertCircle, Contact, Phone, Mail,
  MessageCircle, ChevronDown, ChevronRight, Users, TrendingUp,
  CheckCircle, FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  quote_count: number;
  total_quoted: number;
  last_quote_at: string | null;
  last_quote_status: string | null;
  nueva_count: number;
  contactada_count: number;
  enviada_count: number;
  ganada_count: number;
  perdida_count: number;
}

interface QuoteItem {
  id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Quote {
  id: string;
  status: string;
  total_estimate: number;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  quote_items: QuoteItem[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const STATUS_OPTS = [
  { value: "all",        label: "Todos"       },
  { value: "nueva",      label: "Nueva"       },
  { value: "contactada", label: "Contactada"  },
  { value: "enviada",    label: "Enviada"     },
  { value: "ganada",     label: "Ganada"      },
  { value: "perdida",    label: "Perdida"     },
];

const SORT_OPTS = [
  { value: "last_quote_at_desc", label: "Última cotización" },
  { value: "total_quoted_desc",  label: "Mayor total"       },
  { value: "name_asc",           label: "Nombre A→Z"        },
  { value: "created_at_desc",    label: "Más recientes"     },
];

type SortKey = "last_quote_at_desc" | "total_quoted_desc" | "name_asc" | "created_at_desc";

const STATUS_STYLE: Record<string, string> = {
  nueva:      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  contactada: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  enviada:    "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  ganada:     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  perdida:    "bg-red-500/10 text-red-400 border border-red-500/20",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const openWhatsApp = (phone: string | null) => {
  if (!phone) return;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `52${digits}` : digits;
  window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
};

// ── Component ─────────────────────────────────────────────────────────────────

const ClientesPage = () => {
  const { toast } = useToast();

  // ─ Search debounce ─
  const [query, setQuery]           = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  // ─ Filters / sort ─
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort]                 = useState<SortKey>("last_quote_at_desc");

  // ─ Customers list ─
  const [customers, setCustomers]       = useState<CustomerSummary[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(0);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // ─ KPIs ─
  const [kpis, setKpis] = useState({ total: 0, nuevas: 0, ganados: 0, totalCotizado: 0 });

  // ─ Detail dialog ─
  const [selected, setSelected]         = useState<CustomerSummary | null>(null);
  const [detailQuotes, setDetailQuotes] = useState<Quote[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [notes, setNotes]               = useState("");
  const [savingNotes, setSavingNotes]   = useState(false);

  // ── Build query ─────────────────────────────────────────────────────────────

  const buildQuery = useCallback(() => {
    let q = supabase
      .from("customer_quote_summary")
      .select("*", { count: "exact" }) as any;

    if (searchTerm) {
      q = q.or(
        `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }
    if (statusFilter !== "all") {
      q = q.eq("last_quote_status", statusFilter);
    }
    if (sort === "last_quote_at_desc") q = q.order("last_quote_at", { ascending: false });
    else if (sort === "total_quoted_desc") q = q.order("total_quoted", { ascending: false });
    else if (sort === "name_asc") q = q.order("name", { ascending: true });
    else q = q.order("created_at", { ascending: false });

    return q;
  }, [searchTerm, statusFilter, sort]);

  // ── Load KPIs ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadKpis = async () => {
      const { data, error: err } = await supabase
        .from("customer_quote_summary")
        .select("total_quoted, nueva_count, ganada_count") as any;
      if (err || !data) return;
      const rows = data as { total_quoted: number; nueva_count: number; ganada_count: number }[];
      setKpis({
        total:         rows.length,
        nuevas:        rows.filter(r => (r.nueva_count ?? 0) > 0).length,
        ganados:       rows.filter(r => (r.ganada_count ?? 0) > 0).length,
        totalCotizado: rows.reduce((a, r) => a + Number(r.total_quoted ?? 0), 0),
      });
    };
    loadKpis();
  }, []);

  // ── Load page ───────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(0);

    const run = async () => {
      const { data, error: err, count } = await buildQuery().range(0, PAGE_SIZE - 1);
      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }
      setCustomers((data ?? []) as CustomerSummary[]);
      setTotal(count ?? 0);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [buildQuery]);

  // ── Load more ───────────────────────────────────────────────────────────────

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    const { data, error: err } = await buildQuery().range(
      nextPage * PAGE_SIZE,
      (nextPage + 1) * PAGE_SIZE - 1
    );
    if (!err && data) {
      setCustomers(prev => [...prev, ...(data as CustomerSummary[])]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  // ── Open detail ─────────────────────────────────────────────────────────────

  const openDetail = async (customer: CustomerSummary) => {
    setSelected(customer);
    setNotes(customer.notes ?? "");
    setExpandedQuote(null);
    setDetailLoading(true);
    const { data, error: err } = await supabase
      .from("quotes")
      .select("id, status, total_estimate, notes, admin_notes, created_at, quote_items(id, product_name, product_sku, quantity, unit_price, subtotal)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }) as any;
    setDetailLoading(false);
    if (!err && data) setDetailQuotes(data as Quote[]);
  };

  // ── Save notes ──────────────────────────────────────────────────────────────

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const { error: err } = await supabase
      .from("customers")
      .update({ notes })
      .eq("id", selected.id);
    setSavingNotes(false);
    if (err) {
      toast({ variant: "destructive", title: "Error al guardar", description: err.message });
    } else {
      toast({ title: "Notas guardadas" });
      setSelected(prev => prev ? { ...prev, notes } : prev);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Clientes / Leads</h1>
        <p className="text-sm text-muted-foreground">Seguimiento comercial desde cotizaciones</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-7 w-7 text-primary opacity-70 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
              <p className="text-2xl font-black">{kpis.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-7 w-7 text-blue-400 opacity-70 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Leads Nuevos</p>
              <p className="text-2xl font-black text-blue-400">{kpis.nuevas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-7 w-7 text-emerald-400 opacity-70 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Ganados</p>
              <p className="text-2xl font-black text-emerald-400">{kpis.ganados}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-yellow-400 opacity-70 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Cotizado</p>
              <p className="text-xl font-black text-yellow-400">{fmt(kpis.totalCotizado)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre, empresa, email o teléfono..."
              className="pl-10"
            />
          </div>
          <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {!loading && !error && (
        <p className="text-xs text-muted-foreground">
          {total === 0 ? "Sin resultados" : `${total} cliente${total !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive opacity-40" />
          <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
          <p className="text-xs text-muted-foreground/60">
            Aplica la migración 0013 en Supabase SQL Editor si aún no lo has hecho.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Cliente</TableHead>
                  <TableHead className="font-bold">Empresa</TableHead>
                  <TableHead className="font-bold">Contacto</TableHead>
                  <TableHead className="font-bold text-center">Cotizaciones</TableHead>
                  <TableHead className="font-bold text-right">Total Cotizado</TableHead>
                  <TableHead className="font-bold">Última Cot.</TableHead>
                  <TableHead className="font-bold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-14">
                      <Contact className="h-10 w-10 mx-auto mb-3 opacity-10" />
                      <p className="text-sm">Sin clientes con los filtros actuales</p>
                    </TableCell>
                  </TableRow>
                )}
                {customers.map(c => (
                  <TableRow
                    key={c.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => openDetail(c)}
                  >
                    <TableCell>
                      <p className="font-bold text-sm">{c.name}</p>
                      {c.email && <p className="text-xs text-muted-foreground font-mono">{c.email}</p>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.company || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 disabled:opacity-30 transition-colors"
                          disabled={!c.phone}
                          title="WhatsApp"
                          onClick={e => { e.stopPropagation(); openWhatsApp(c.phone); }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                          disabled={!c.email}
                          title="Email"
                          onClick={e => { e.stopPropagation(); if (c.email) window.location.href = `mailto:${c.email}`; }}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        {c.phone && (
                          <button
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Llamar"
                            onClick={e => { e.stopPropagation(); window.location.href = `tel:${c.phone}`; }}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold">{c.quote_count}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {Number(c.total_quoted) > 0 ? fmt(Number(c.total_quoted)) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(c.last_quote_at)}</TableCell>
                    <TableCell>
                      {c.last_quote_status ? (
                        <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[c.last_quote_status] ?? ""}`}>
                          {c.last_quote_status}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">Sin cots.</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Load more */}
      {!loading && !error && customers.length < total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="gap-2 px-8">
            {loadingMore
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Cargando...</>
              : `Cargar más (${total - customers.length} restantes)`}
          </Button>
        </div>
      )}

      {/* ── Detail Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setDetailQuotes([]); } }}>
        {selected && (
          <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">{selected.name}</DialogTitle>
            </DialogHeader>

            {/* Info + contact actions */}
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                {selected.company && (
                  <p className="text-muted-foreground"><span className="font-bold text-foreground">Empresa:</span> {selected.company}</p>
                )}
                {selected.email && (
                  <p className="text-muted-foreground"><span className="font-bold text-foreground">Email:</span> {selected.email}</p>
                )}
                {selected.phone && (
                  <p className="text-muted-foreground"><span className="font-bold text-foreground">Teléfono:</span> {selected.phone}</p>
                )}
                <p className="text-muted-foreground"><span className="font-bold text-foreground">Cliente desde:</span> {fmtDate(selected.created_at)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 justify-start border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  disabled={!selected.phone}
                  onClick={() => openWhatsApp(selected.phone)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {selected.phone ? "Abrir WhatsApp" : "Sin teléfono"}
                </Button>
                {selected.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 justify-start"
                    onClick={() => window.location.href = `mailto:${selected.email}`}
                  >
                    <Mail className="h-4 w-4" /> Enviar email
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/30 rounded p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Cotizaciones</p>
                <p className="text-xl font-black">{selected.quote_count}</p>
              </div>
              <div className="bg-muted/30 rounded p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Cotizado</p>
                <p className="text-lg font-black">{fmt(Number(selected.total_quoted))}</p>
              </div>
              <div className="bg-muted/30 rounded p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Últ. Estado</p>
                <p className={`text-sm font-black uppercase mt-0.5 ${
                  selected.last_quote_status === "ganada" ? "text-emerald-400" :
                  selected.last_quote_status === "perdida" ? "text-red-400" :
                  selected.last_quote_status === "nueva" ? "text-blue-400" : "text-muted-foreground"
                }`}>
                  {selected.last_quote_status ?? "—"}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">Notas internas</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones, acuerdos, seguimientos..."
                rows={3}
                className="resize-none text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={saveNotes}
                disabled={savingNotes || notes === (selected.notes ?? "")}
                className="gap-2"
              >
                {savingNotes ? <><RefreshCw className="h-3 w-3 animate-spin" /> Guardando...</> : "Guardar notas"}
              </Button>
            </div>

            {/* Quote history */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Historial de Cotizaciones</p>

              {detailLoading && (
                <div className="flex justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary opacity-50" />
                </div>
              )}

              {!detailLoading && detailQuotes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Sin cotizaciones registradas</p>
              )}

              {!detailLoading && detailQuotes.map(q => (
                <div key={q.id} className="border border-white/5 rounded">
                  {/* Quote header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                    onClick={() => setExpandedQuote(expandedQuote === q.id ? null : q.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedQuote === q.id
                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{fmtDate(q.created_at)}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[q.status] ?? ""}`}>
                        {q.status}
                      </span>
                    </div>
                    <span className="font-bold text-sm">{fmt(Number(q.total_estimate))}</span>
                  </button>

                  {/* Quote items */}
                  {expandedQuote === q.id && (
                    <div className="px-4 pb-3 space-y-2 border-t border-white/5">
                      {q.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">"{q.notes}"</p>
                      )}
                      {q.quote_items.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {q.quote_items.map(item => (
                            <div key={item.id} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                              <span className="text-foreground/80">
                                {item.product_name}
                                <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                              </span>
                              <span className="font-mono text-muted-foreground">{fmt(Number(item.subtotal))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default ClientesPage;
