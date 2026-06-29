-- =============================================================================
-- Migration: 20260628000002_quote_flow_tables.sql
-- Purpose : Create new tables for the WhatsApp quotation flow.
--           customers → quotes → quote_items (public funnel)
--           inventory_movements (admin audit trail)
-- Design  : Single-tenant (EISEN), no tenant_id columns for now.
--           Schema is designed to add tenant_id later without breaking changes.
-- Review  : Confirm column types match your data before applying.
-- Apply   : Run AFTER migration 20260628000001.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: customers
-- Stores leads and contacts from the public quote form.
-- No account required — anon visitors can submit.
-- When a visitor creates an account later, user_id links them.
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text,
  phone         text,
  company       text,
  notes         text,
  user_id       uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.customers enable row level security;

-- Anon can submit (insert) their contact info for a quote
create policy "customers_insert_anon"
  on public.customers for insert
  to anon, authenticated
  with check (true);

-- Authenticated users can read their own record (matched by user_id)
create policy "customers_select_own"
  on public.customers for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Admins can update any customer record
create policy "customers_update_admin"
  on public.customers for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- TABLE: quotes
-- Each quote is linked to a customer and has a lifecycle status.
-- ---------------------------------------------------------------------------

create table if not exists public.quotes (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  status          text not null default 'nueva'
                    check (status in ('nueva', 'contactada', 'enviada', 'ganada', 'perdida')),
  total_estimate  numeric(12, 2) not null default 0,
  notes           text,
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.quotes enable row level security;

-- Anon/authenticated can insert their own quote
create policy "quotes_insert_any"
  on public.quotes for insert
  to anon, authenticated
  with check (true);

-- Admins can read all quotes
create policy "quotes_select_admin"
  on public.quotes for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Admins can update quote status, notes, etc.
create policy "quotes_update_admin"
  on public.quotes for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- TABLE: quote_items
-- Line items per quote. Prices are snapshots (product price at quote time).
-- ---------------------------------------------------------------------------

create table if not exists public.quote_items (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references public.quotes(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  product_name    text not null,
  product_sku     text not null,
  unit_price      numeric(12, 2) not null,
  quantity        integer not null check (quantity > 0),
  subtotal        numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at      timestamptz not null default now()
);

alter table public.quote_items enable row level security;

-- Anyone can insert items as part of a quote submission
create policy "quote_items_insert_any"
  on public.quote_items for insert
  to anon, authenticated
  with check (true);

-- Admins can read all quote items
create policy "quote_items_select_admin"
  on public.quote_items for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Admins can update/delete quote items
create policy "quote_items_write_admin"
  on public.quote_items for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- TABLE: inventory_movements
-- Audit trail for stock changes. Append-only in practice.
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_movements (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete restrict,
  movement_type    text not null check (movement_type in ('in', 'out', 'adjustment')),
  quantity_change  integer not null,   -- positive = stock added, negative = stock removed
  reason           text,
  reference_id     text,               -- e.g. quote id or sale id
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

-- Only admins can read or insert movements
create policy "inventory_movements_admin_all"
  on public.inventory_movements for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- UPDATED_AT trigger for tables that have the column
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to customers
drop trigger if exists set_updated_at_customers on public.customers;
create trigger set_updated_at_customers
  before update on public.customers
  for each row execute function public.set_updated_at();

-- Apply trigger to quotes
drop trigger if exists set_updated_at_quotes on public.quotes;
create trigger set_updated_at_quotes
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTS: expose new tables to Data API (required since April 2026)
-- ---------------------------------------------------------------------------

-- anon can insert quotes/customers (no-account quote flow)
grant insert on public.customers to anon;
grant insert on public.quotes to anon;
grant insert on public.quote_items to anon;

-- authenticated gets full access (RLS enforces row-level restrictions above)
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.quote_items to authenticated;
grant select, insert, update, delete on public.inventory_movements to authenticated;

-- ---------------------------------------------------------------------------
-- INDEXES: basic performance indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_quotes_customer_id on public.quotes(customer_id);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_inventory_movements_product_id on public.inventory_movements(product_id);
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_customers_email on public.customers(email);
