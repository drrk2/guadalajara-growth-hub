// Supabase Edge Function — send-customer-notification
// Invocada por el admin al marcar una cotización como "ganada".
// Registra en customer_notifications y, si hay secrets de WhatsApp, envía mensaje real.
//
// Secrets requeridos para envío real (supabase secrets set):
//   WHATSAPP_ACCESS_TOKEN
//   WHATSAPP_PHONE_NUMBER_ID
//   WHATSAPP_API_VERSION  (default: v18.0)
//
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son inyectados automáticamente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── Parse body ──────────────────────────────────────────────────────────
    const { quote_id } = await req.json().catch(() => ({}));
    if (!quote_id) return json({ error: "quote_id is required" }, 400);

    // ── Admin client (bypasses RLS) ─────────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // ── Fetch quote + customer + items ──────────────────────────────────────
    const { data: quote, error: qErr } = await admin
      .from("quotes")
      .select(`
        id, total_estimate, status,
        customers ( id, name, phone, company ),
        quote_items ( product_name, product_sku, quantity, unit_price )
      `)
      .eq("id", quote_id)
      .single();

    if (qErr || !quote) return json({ error: qErr?.message ?? "Quote not found" }, 404);

    const customer = quote.customers as {
      id: string; name: string; phone: string | null; company: string | null;
    };
    const items = quote.quote_items as {
      product_name: string; product_sku: string; quantity: number; unit_price: number;
    }[];

    // ── Check phone ─────────────────────────────────────────────────────────
    const phone = customer?.phone ?? null;
    if (!phone) {
      await admin.from("customer_notifications").insert({
        quote_id,
        customer_id: customer?.id ?? null,
        channel: "whatsapp",
        recipient: "unknown",
        message: "",
        status: "skipped",
        error_message: "Customer has no phone number",
      });
      return json({ status: "skipped", reason: "no_phone" });
    }

    // ── Build WhatsApp number ───────────────────────────────────────────────
    const digits  = phone.replace(/\D/g, "");
    const waPhone = digits.length === 10 ? `52${digits}` : digits;

    // ── Build message ───────────────────────────────────────────────────────
    const folio = quote_id.slice(0, 8).toUpperCase();
    const empresa = customer.company ? ` de *${customer.company}*` : "";
    let msg = `Hola *${customer.name}*${empresa},\n\n`;
    msg += `Tu pedido en *EISEN Industrial* fue confirmado. 🎉\n\n`;
    msg += `*Folio:* ${folio}\n`;
    msg += `*Productos:*\n`;
    for (const item of items) {
      const subtotal = (item.unit_price * item.quantity).toFixed(2);
      msg += `  • ${item.product_name} (×${item.quantity}) — $${subtotal}\n`;
    }
    msg += `\n*Total:* $${Number(quote.total_estimate).toFixed(2)} MXN\n`;
    msg += `\nPor favor responde este mensaje si tienes alguna pregunta.`;

    // ── Attempt WhatsApp Cloud API ──────────────────────────────────────────
    const waToken      = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const waPhoneId    = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const waApiVersion = Deno.env.get("WHATSAPP_API_VERSION") ?? "v18.0";

    let notifStatus   = "pending";
    let providerMsgId: string | null = null;
    let errorMsg: string | null      = null;
    let sentAt: string | null        = null;

    if (waToken && waPhoneId) {
      const waResp = await fetch(
        `https://graph.facebook.com/${waApiVersion}/${waPhoneId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: waPhone,
            type: "text",
            text: { body: msg },
          }),
        },
      );
      const waBody = await waResp.json();
      if (waResp.ok && waBody.messages?.[0]?.id) {
        notifStatus   = "sent";
        providerMsgId = waBody.messages[0].id;
        sentAt        = new Date().toISOString();
      } else {
        notifStatus = "failed";
        errorMsg    = JSON.stringify(waBody);
      }
    } else {
      notifStatus = "skipped";
      errorMsg    = "WhatsApp provider not configured";
    }

    // ── Persist notification record ─────────────────────────────────────────
    const { data: notif } = await admin
      .from("customer_notifications")
      .insert({
        quote_id,
        customer_id:         customer?.id ?? null,
        channel:             "whatsapp",
        recipient:           waPhone,
        message:             msg,
        status:              notifStatus,
        provider:            waToken ? "whatsapp_cloud" : null,
        provider_message_id: providerMsgId,
        error_message:       errorMsg,
        sent_at:             sentAt,
      })
      .select("id")
      .single();

    return json({ status: notifStatus, notification_id: notif?.id ?? null });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});
