import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, X, Plus, Minus, Send, ArrowLeft, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSystem } from "@/context/SystemContext";
import { tenant } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// ── Types & helpers ───────────────────────────────────────────────────────────

type Step         = "cart" | "contact";
type DeliveryType = "delivery" | "pickup";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid  = (v: string) => UUID_RE.test(v);

const phoneForWa = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `52${digits}` : digits;
};

// crypto.randomUUID() is only available on HTTPS / modern browsers.
// This fallback uses crypto.getRandomValues() which has broader support.
const createUuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
};

// ── Component ─────────────────────────────────────────────────────────────────

export function CartDrawer() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useSystem();
  const { toast } = useToast();
  const [open, setOpen]                         = useState(false);
  const [step, setStep]                         = useState<Step>("cart");
  const [submitting, setSubmitting]             = useState(false);
  const [deliveryType, setDeliveryType]         = useState<DeliveryType>("delivery");
  const [pendingWhatsAppUrl, setPendingWhatsAppUrl] = useState<string | null>(null);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setStep("cart");
      setDeliveryType("delivery");
      setPendingWhatsAppUrl(null);
    }
  };

  const buildMessage = (
    name: string, phone: string, company: string | null,
    dType: DeliveryType, dCity: string, dZip: string, dAddress: string, dNotes: string,
  ) => {
    let msg = "*Nueva Cotización — EISEN Industrial*\n\n";
    items.forEach(item => {
      msg += `- *${item.sku}* | ${item.name} (×${item.quantity}) — $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    msg += `\n*Subtotal Estimado:* $${totalPrice.toFixed(2)}\n\n`;
    msg += `*Nombre:* ${name}\n`;
    if (company) msg += `*Empresa:* ${company}\n`;
    msg += `*Tel:* ${phone}\n`;
    if (dType === "delivery") {
      msg += `\n📦 *Envío a domicilio*\n`;
      if (dCity)    msg += `Ciudad: ${dCity}\n`;
      if (dZip)     msg += `C.P.: ${dZip}\n`;
      if (dAddress) msg += `Dirección: ${dAddress}\n`;
    } else {
      msg += `\n🏪 *Recoger en sucursal*\n`;
    }
    if (dNotes) msg += `\n📝 Notas: ${dNotes}`;
    return msg;
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const name    = ((fd.get("name")    as string) ?? "").trim();
    const phone   = ((fd.get("phone")   as string) ?? "").trim();
    const company = ((fd.get("company") as string) ?? "").trim() || null;
    // delivery_city/zip/address are absent from FormData when deliveryType === "pickup"
    const dCity    = ((fd.get("delivery_city")    as string | null) ?? "").trim();
    const dZip     = ((fd.get("delivery_zip")     as string | null) ?? "").trim();
    const dAddress = ((fd.get("delivery_address") as string | null) ?? "").trim();
    const dNotes   = ((fd.get("delivery_notes")   as string | null) ?? "").trim();

    let dbSuccess  = false;
    let dbErrorMsg = "";

    try {
      let customerId: string;
      const quoteId = createUuid();

      if (user) {
        // Logged-in: find or create a customer record tied to this account
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (existing && existing.length > 0) {
          customerId = existing[0].id;
          // Update with latest contact info
          await supabase.from("customers").update({ name, phone, company }).eq("id", customerId);
        } else {
          customerId = createUuid();
          const { error: custErr } = await supabase.from("customers").insert({
            id: customerId, name, phone, company, email: user.email, user_id: user.id,
          });
          if (custErr) throw custErr;
        }
      } else {
        // Anonymous: create a new customer every time
        customerId = createUuid();
        const { error: custErr } = await supabase.from("customers").insert({
          id: customerId, name, phone, company,
        });
        if (custErr) throw custErr;
      }

      // 2. quote with delivery fields
      const { error: quoteErr } = await supabase.from("quotes").insert({
        id:               quoteId,
        customer_id:      customerId,
        total_estimate:   totalPrice,
        status:           "nueva",
        delivery_type:    deliveryType,
        delivery_city:    dCity    || null,
        delivery_zip:     dZip     || null,
        delivery_address: deliveryType === "delivery" ? dAddress || null : null,
        delivery_notes:   dNotes   || null,
      });
      if (quoteErr) throw quoteErr;

      // 3. quote items — product_id may not be a UUID for old localStorage cart items
      const quoteItems = items.map(item => ({
        quote_id:     quoteId,
        product_id:   isUuid(item.id) ? item.id : null,
        product_name: item.name,
        product_sku:  item.sku,
        unit_price:   item.price,
        quantity:     item.quantity,
      }));
      const { error: itemsErr } = await supabase.from("quote_items").insert(quoteItems);
      if (itemsErr) throw itemsErr;

      dbSuccess = true;
    } catch (err) {
      console.error("Error saving quote:", err);
      dbErrorMsg = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      setSubmitting(false);
    }

    if (!dbSuccess) {
      // keep drawer open and cart intact so the user can retry
      toast({
        variant:     "destructive",
        title:       "Error al guardar cotización",
        description: dbErrorMsg,
      });
      return;
    }

    // ── success path ──────────────────────────────────────────────────────────
    const waText  = buildMessage(name, phone, company, deliveryType, dCity, dZip, dAddress, dNotes);
    const encoded = encodeURIComponent(waText);
    const waUrl   = `https://wa.me/${phoneForWa(tenant.whatsapp)}?text=${encoded}`;

    clearCart();

    // Mobile browsers block window.open after async work — detect by touch support.
    // On desktop, try the popup; if the browser blocked it, fall through to the same
    // visible-button fallback used on mobile.
    const isMobile = navigator.maxTouchPoints > 0;
    if (!isMobile) {
      const opened = window.open(waUrl, "_blank", "noopener,noreferrer");
      if (opened) {
        toast({ title: "¡Cotización registrada!", description: "WhatsApp abierto en nueva pestaña." });
        handleOpenChange(false);
        return;
      }
    }

    // Popup blocked or mobile: keep drawer open and show a tappable link.
    setPendingWhatsAppUrl(waUrl);
    toast({ title: "¡Cotización registrada!", description: "Abre WhatsApp para enviarla." });
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white/60 hover:text-primary transition-colors">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      {/* h-dvh + overflow-hidden ensure the panel never grows past the viewport
          and both steps keep the footer button pinned at the bottom */}
      <SheetContent className="w-full sm:max-w-md h-dvh max-h-dvh bg-[#0a0a0a] border-white/10 text-white flex flex-col p-0 overflow-hidden">
        <SheetHeader className="shrink-0 p-6 border-b border-white/10">
          <SheetTitle className="text-xl font-display font-black text-white text-left uppercase tracking-tight flex items-center gap-2">
            {step === "contact" && (
              <button
                onClick={() => setStep("cart")}
                className="text-white/40 hover:text-white transition-colors mr-1"
                aria-label="Volver al carrito"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <ShoppingCart className="h-5 w-5 text-primary" />
            {step === "cart" ? "Cotización Actual" : "Tus Datos de Contacto"}
          </SheetTitle>
        </SheetHeader>

        {/* ── PASO 1: ITEMS ── */}
        {step === "cart" && (
          <>
            {/* min-h-0 lets this flex child shrink below its content height */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-white/40 pt-20">
                  <ShoppingCart className="h-16 w-16 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-20 w-20 bg-white/5 rounded-md overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover mix-blend-screen" />
                        ) : (
                          <div className="text-[10px] text-white/20 font-bold uppercase">Sin Imagen</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-primary mb-1">{item.sku}</p>
                            <h4 className="text-sm font-medium text-white/90 line-clamp-2">{item.name}</h4>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-white/40 hover:text-red-500 transition-colors p-1"
                            aria-label="Quitar del carrito"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 bg-white/5 rounded-md border border-white/10 p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="shrink-0 p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-white/60 uppercase tracking-widest font-bold">Subtotal Estimado</span>
                  <span className="font-display font-black text-2xl">${totalPrice.toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => setStep("contact")}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-none skew-x-[-12deg] transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[45deg]" />
                  <span className="skew-x-[12deg] flex items-center justify-center gap-2">
                    SOLICITAR COTIZACIÓN FORMAL <Send className="h-4 w-4" />
                  </span>
                </Button>
                <p className="text-[10px] text-center text-white/40 mt-4 uppercase tracking-widest">
                  Te pediremos tus datos y abriremos WhatsApp.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── PASO 2: CONTACTO + ENTREGA ── */}
        {step === "contact" && (
          <form id="contact-form" onSubmit={handleContactSubmit} className="flex min-h-0 flex-1 flex-col">

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-6">
                Ingresa tus datos para que un asesor te contacte con la cotización formal.
              </p>

              <div className="space-y-4">

                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-xs uppercase tracking-widest text-white/60 font-bold">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="contact-name"
                    name="name"
                    placeholder="Juan García"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="contact-phone" className="text-xs uppercase tracking-widest text-white/60 font-bold">
                    Teléfono / WhatsApp *
                  </Label>
                  <Input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="+52 33 1234 5678"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                  />
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="contact-company" className="text-xs uppercase tracking-widest text-white/60 font-bold">
                    Empresa (opcional)
                  </Label>
                  <Input
                    id="contact-company"
                    name="company"
                    placeholder="Nombre de tu empresa"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
                  />
                </div>

                {/* ── Entrega ── */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs uppercase tracking-widest text-white/60 font-bold block">
                    Tipo de Entrega
                  </Label>

                  <div className="flex border border-white/10">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                        deliveryType === "delivery"
                          ? "bg-primary text-white"
                          : "bg-transparent text-white/40 hover:text-white/70"
                      }`}
                    >
                      📦 Envío
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors border-l border-white/10 ${
                        deliveryType === "pickup"
                          ? "bg-primary text-white"
                          : "bg-transparent text-white/40 hover:text-white/70"
                      }`}
                    >
                      🏪 Recoger
                    </button>
                  </div>

                  {/* Campos de dirección — solo si envío */}
                  {deliveryType === "delivery" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="delivery-city" className="text-xs uppercase tracking-widest text-white/60 font-bold">
                            Ciudad *
                          </Label>
                          <Input
                            id="delivery-city"
                            name="delivery_city"
                            placeholder="Guadalajara"
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delivery-zip" className="text-xs uppercase tracking-widest text-white/60 font-bold">
                            C.P.
                          </Label>
                          <Input
                            id="delivery-zip"
                            name="delivery_zip"
                            placeholder="44100"
                            inputMode="numeric"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery-address" className="text-xs uppercase tracking-widest text-white/60 font-bold">
                          Dirección (opcional)
                        </Label>
                        <Input
                          id="delivery-address"
                          name="delivery_address"
                          placeholder="Calle, número, colonia"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notas — siempre visible */}
                  <div className="space-y-2">
                    <Label htmlFor="delivery-notes" className="text-xs uppercase tracking-widest text-white/60 font-bold">
                      Notas (opcional)
                    </Label>
                    <Input
                      id="delivery-notes"
                      name="delivery_notes"
                      placeholder="Instrucciones especiales de entrega..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary text-sm"
                    />
                  </div>
                </div>

                {/* Resumen del pedido */}
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Resumen</p>
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-white/60 truncate max-w-[220px]">{item.name} ×{item.quantity}</span>
                      <span className="font-bold text-white/80 ml-2 flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                    <span className="font-bold uppercase tracking-widest text-white/60">Total Est.</span>
                    <span className="font-display font-black text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned footer — always visible above the keyboard */}
            <div className="shrink-0 p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
              {pendingWhatsAppUrl ? (
                <>
                  <a
                    href={pendingWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full h-14 items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-none skew-x-[-12deg] transition-colors"
                  >
                    <span className="skew-x-[12deg] flex items-center gap-2 uppercase tracking-widest text-sm">
                      <Send className="h-4 w-4" /> Abrir WhatsApp
                    </span>
                  </a>
                  <p className="text-[10px] text-center text-white/40 mt-4 uppercase tracking-widest">
                    Cotización registrada. Toca para enviarla por WhatsApp.
                  </p>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-none skew-x-[-12deg] transition-all group overflow-hidden relative disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[45deg]" />
                    <span className="skew-x-[12deg] flex items-center justify-center gap-2">
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                      ) : (
                        <>ENVIAR POR WHATSAPP <Send className="h-4 w-4" /></>
                      )}
                    </span>
                  </Button>
                  <p className="text-[10px] text-center text-white/40 mt-4 uppercase tracking-widest">
                    Abriremos WhatsApp con tu cotización lista.
                  </p>
                </>
              )}
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
