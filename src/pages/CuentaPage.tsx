import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSystem } from "@/context/SystemContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import {
  LogOut, ShoppingCart, MessageCircle, ChevronDown, ChevronRight,
  RefreshCw, FileText, Package, EyeOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  created_at: string;
  quote_items: QuoteItem[];
  customers: { name: string; phone: string | null; company: string | null } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  nueva:      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  contactada: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  enviada:    "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  ganada:     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  perdida:    "bg-red-500/10 text-red-400 border border-red-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  nueva:      "Solicitud recibida",
  contactada: "En revisión",
  enviada:    "Propuesta enviada",
  ganada:     "Pedido confirmado",
  perdida:    "Cancelado",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

const openWhatsApp = (phone: string | null) => {
  if (!phone) return;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `52${digits}` : digits;
  window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CuentaPage() {
  const { user, logout } = useSystem();
  const { totalItems }   = useCart();
  const navigate         = useNavigate();

  const [quotes, setQuotes]         = useState<Quote[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [hiddenIds, setHiddenIds]   = useState<Set<string>>(new Set());
  const [hidingId, setHidingId]     = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("quotes")
      .select(`
        id, status, total_estimate, created_at,
        customers(name, phone, company),
        quote_items(id, product_name, product_sku, quantity, unit_price, subtotal)
      `)
      .order("created_at", { ascending: false }) as any;

    if (err) {
      setError(err.message);
    } else {
      setQuotes((data ?? []) as Quote[]);
    }
    setLoading(false);
  }, [user]);

  const loadHiddenIds = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("client_hidden_quotes")
      .select("quote_id") as any;
    if (data) setHiddenIds(new Set((data as { quote_id: string }[]).map(r => r.quote_id)));
  }, [user]);

  const hideQuote = async (quoteId: string) => {
    if (!user) return;
    setHidingId(quoteId);
    const { error: err } = await supabase.from("client_hidden_quotes").insert({
      user_id:  user.id,
      quote_id: quoteId,
    });
    if (!err) {
      setHiddenIds(prev => new Set([...prev, quoteId]));
      setExpanded(null);
    }
    setHidingId(null);
  };

  useEffect(() => {
    loadQuotes();
    loadHiddenIds();
  }, [loadQuotes, loadHiddenIds]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-4">
          <button
            onClick={() => navigate("/")}
            className="font-display font-black text-xl tracking-tighter hover:text-primary transition-colors"
          >
            EISEN
          </button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-white/60 hover:text-white relative"
              onClick={() => navigate("/#catalogo")}
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-white/40 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10 relative z-10">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-2">Mi Cuenta</p>
          <h1 className="text-3xl font-display font-black uppercase tracking-tight">
            {user?.name ?? user?.email}
          </h1>
          {user?.email && user?.name && (
            <p className="text-sm text-white/40 font-mono mt-1">{user.email}</p>
          )}
        </div>

        {/* Contact card */}
        {quotes.length > 0 && quotes[0].customers && (
          <div className="flex flex-wrap gap-3">
            {quotes[0].customers.phone && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => openWhatsApp(quotes[0].customers!.phone)}
              >
                <MessageCircle className="h-4 w-4" /> Contactar por WhatsApp
              </Button>
            )}
          </div>
        )}

        {/* Quotes section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
              Mis Cotizaciones
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-white/40 hover:text-white"
              onClick={loadQuotes}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive/80">
              {error}
              <p className="text-xs mt-1 text-white/30">
                Asegúrate de haber aplicado la migración 0015 en Supabase.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-30" />
            </div>
          )}

          {/* Empty */}
          {!loading && !error && quotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <FileText className="h-12 w-12 opacity-10" />
              <p className="text-sm text-white/30 uppercase tracking-widest font-bold">
                Aún no tienes cotizaciones
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/#catalogo")}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> Explorar catálogo
              </Button>
            </div>
          )}

          {/* Quote list */}
          {!loading && !error && quotes.filter(q => !hiddenIds.has(q.id)).map(q => (
            <div
              key={q.id}
              className="border border-white/5 rounded bg-white/[0.02] overflow-hidden"
            >
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
                onClick={() => setExpanded(prev => prev === q.id ? null : q.id)}
              >
                <div className="flex items-center gap-4">
                  {expanded === q.id
                    ? <ChevronDown className="h-4 w-4 text-white/30" />
                    : <ChevronRight className="h-4 w-4 text-white/30" />
                  }
                  <div>
                    <p className="text-xs font-mono text-white/30 mb-0.5">{fmtDate(q.created_at)}</p>
                    <p className="font-bold text-sm">
                      {q.quote_items.length} producto{q.quote_items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[q.status] ?? ""}`}>
                    {STATUS_LABEL[q.status] ?? q.status}
                  </span>
                </div>
                <p className="font-display font-black text-lg text-primary">{fmt(q.total_estimate)}</p>
              </button>

              {/* Items */}
              {expanded === q.id && (
                <div className="border-t border-white/5 px-5 py-4 space-y-3">
                  {q.quote_items.length === 0 ? (
                    <p className="text-xs text-white/30 text-center py-4">Sin productos registrados</p>
                  ) : (
                    <div className="space-y-2">
                      {q.quote_items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                          <Package className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{item.product_name}</p>
                            <p className="text-[10px] font-mono text-white/30">
                              {item.product_sku} · ×{item.quantity} · {fmt(item.unit_price)} c/u
                            </p>
                          </div>
                          <p className="font-bold font-mono text-sm ml-3 flex-shrink-0">{fmt(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status note */}
                  <div className={`text-xs px-3 py-2 rounded ${STATUS_STYLE[q.status] ?? "text-white/40"}`}>
                    {q.status === "nueva"      && "Tu solicitud fue recibida. Un asesor te contactará pronto."}
                    {q.status === "contactada" && "Ya nos comunicamos contigo. Estamos preparando tu propuesta."}
                    {q.status === "enviada"    && "La propuesta formal fue enviada. Revisa tu WhatsApp o correo."}
                    {q.status === "ganada"     && "¡Pedido confirmado! Gracias por tu compra en EISEN Industrial."}
                    {q.status === "perdida"    && "Esta cotización fue cancelada."}
                  </div>

                  {/* Hide action */}
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={hidingId === q.id}
                      onClick={() => hideQuote(q.id)}
                      className="gap-1.5 text-white/20 hover:text-white/50 text-xs"
                    >
                      {hidingId === q.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      Ocultar de mi vista
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
