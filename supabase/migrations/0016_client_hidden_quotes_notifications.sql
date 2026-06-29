-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 0016: Cotizaciones ocultas por cliente + tabla de notificaciones
-- Aplica en Supabase SQL Editor → revisa antes de ejecutar.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── client_hidden_quotes ──────────────────────────────────────────────────────
-- Permite que cada cliente oculte cotizaciones de su vista en /cuenta
-- sin borrar nada de la base real.

create table if not exists public.client_hidden_quotes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  quote_id   uuid        not null references public.quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, quote_id)
);
comment on table public.client_hidden_quotes is 'Cotizaciones que el cliente eligió ocultar de su vista en /cuenta. No afecta admin.';

alter table public.client_hidden_quotes enable row level security;

create policy "client_hidden_quotes_own"
  on public.client_hidden_quotes for all
  to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, delete on public.client_hidden_quotes to authenticated;

-- ── customer_notifications ────────────────────────────────────────────────────
-- Registro de notificaciones enviadas a clientes cuando su cotización
-- pasa a "ganada". Soporta WhatsApp Cloud API u otros proveedores.

create table if not exists public.customer_notifications (
  id                  uuid        primary key default gen_random_uuid(),
  quote_id            uuid        references public.quotes(id)    on delete cascade,
  customer_id         uuid        references public.customers(id) on delete cascade,
  channel             text        not null default 'whatsapp'
                                  check (channel in ('whatsapp', 'sms')),
  recipient           text        not null,
  message             text        not null,
  status              text        not null default 'pending'
                                  check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider            text,
  provider_message_id text,
  error_message       text,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);
comment on table public.customer_notifications is 'Historial de notificaciones (WhatsApp / SMS) enviadas a clientes.';

alter table public.customer_notifications enable row level security;

-- Solo admin puede leer el historial de notificaciones
create policy "customer_notifications_admin_select"
  on public.customer_notifications for select
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  ));

-- El sistema (edge function con service_role) inserta directamente →
-- no se necesita policy de insert para authenticated.

grant select on public.customer_notifications to authenticated;
