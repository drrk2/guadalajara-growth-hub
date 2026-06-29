-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 0015: Carrito por cliente + acceso a cotizaciones propias
-- Aplica en Supabase SQL Editor → revisa antes de ejecutar.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── client_carts ──────────────────────────────────────────────────────────────
-- Persiste el carrito de cada usuario autenticado en la DB.
-- user_id es PK (1 carrito por usuario).

create table if not exists public.client_carts (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  items      jsonb       not null default '[]'::jsonb,

  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.client_carts is 'Carrito persistido por usuario autenticado (1 fila = 1 usuario).';

create trigger client_carts_updated_at
  before update on public.client_carts
  for each row execute procedure public.set_updated_at();

alter table public.client_carts enable row level security;

-- Cada usuario solo puede ver y modificar su propio carrito
create policy "client_carts_own"
  on public.client_carts for all
  to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.client_carts to authenticated;

-- ── Políticas para que clientes vean sus propias cotizaciones ─────────────────
-- Las políticas admin ya existen (quotes_select_admin, quote_items_select_admin).
-- Estas políticas son ADICIONALES — no eliminan las de admin.

-- Clientes pueden ver las cotizaciones de su propio customer (via customers.user_id)
create policy "quotes_select_client_own"
  on public.quotes for select
  to authenticated
  using (
    exists (
      select 1 from public.customers c
      where c.id = quotes.customer_id
        and c.user_id = (select auth.uid())
    )
  );

-- Clientes pueden ver los ítems de sus propias cotizaciones
create policy "quote_items_select_client_own"
  on public.quote_items for select
  to authenticated
  using (
    exists (
      select 1 from public.quotes q
      join public.customers c on c.id = q.customer_id
      where q.id = quote_items.quote_id
        and c.user_id = (select auth.uid())
    )
  );

-- ── Notas de seguridad ────────────────────────────────────────────────────────
-- · clients NO pueden hacer UPDATE/DELETE en quotes ni quote_items.
-- · clients NO pueden ver admin_notes (quedan expuestos en la fila, pero
--   CuentaPage no los muestra — para ocultar completamente habría que crear
--   una view con security_invoker, lo cual queda fuera de este scope).
-- · La policy quotes_insert_public (anon + authenticated) permanece para el flujo
--   de cotización público desde el carrito.
