-- =============================================================================
-- 0001_baseline_schema.sql
-- EISEN Industrial SaaS — Schema completo desde cero
-- Proyecto Supabase nuevo, sin tablas previas.
--
-- Aplica en: Supabase Dashboard → SQL Editor
-- Orden:     Esta es la única migración base; aplicar antes de 0002_seed.
-- Revisión:  NO aplicar directamente — revisar y confirmar primero.
-- =============================================================================
--
-- DISEÑO:
--   · Roles de usuario: solo 'admin' y 'client'. Check constraint en profiles.
--   · Flujo público: visitante → formulario → quote + quote_items (sin cuenta).
--   · Flujo admin: gestión de catálogo, inventario, empleados, nómina, gastos.
--   · Sin multi-tenant por ahora (sin tenant_id). Diseño permite agregarlo luego.
--   · Sin pagos. Conversión a venta es manual por el admin.
--   · RLS habilitado en todas las tablas.
--   · GRANTs explícitos (requerido desde Supabase abril 2026).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1: set_updated_at()
-- Sin dependencias de tablas — puede crearse primero para usarla en triggers.
-- ─────────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2: TABLAS (en orden de dependencias FK)
-- Las funciones que referencian tablas van DESPUÉS de esta sección.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text        not null default '',
  role        text        not null default 'client'
                          check (role in ('admin', 'client')),
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Perfil extendido de cada usuario. role solo puede ser admin o client.';

-- ── products ─────────────────────────────────────────────────────────────────
create table public.products (
  id          uuid          primary key default gen_random_uuid(),
  name        text          not null,
  sku         text          not null unique,
  description text,
  category    text,
  brand       text,
  unit        text          not null default 'pieza',
  price       numeric(12,2) not null default 0 check (price >= 0),
  cost        numeric(12,2)           default 0 check (cost >= 0),
  stock       integer       not null default 0 check (stock >= 0),
  min_stock   integer       not null default 0 check (min_stock >= 0),
  image       text,
  active      boolean       not null default true,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);
comment on table public.products is 'Catálogo de refacciones industriales. Público para lectura.';

-- ── employees ────────────────────────────────────────────────────────────────
create table public.employees (
  id          uuid          primary key default gen_random_uuid(),
  name        text          not null,
  position    text,
  salary      numeric(12,2) default 0,
  status      text          not null default 'active'
                            check (status in ('active', 'inactive')),
  start_date  date,
  notes       text,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);
comment on table public.employees is 'Personal de EISEN — admin-only. No son cuentas de usuario de Supabase Auth.';

-- ── payroll ───────────────────────────────────────────────────────────────────
create table public.payroll (
  id          uuid          primary key default gen_random_uuid(),
  employee_id uuid          not null references public.employees(id) on delete cascade,
  period      text          not null,
  amount      numeric(12,2) not null default 0,
  status      text          not null default 'pending'
                            check (status in ('pending', 'paid')),
  paid_date   date,
  notes       text,
  created_at  timestamptz   not null default now()
);

-- ── expenses ──────────────────────────────────────────────────────────────────
create table public.expenses (
  id          uuid          primary key default gen_random_uuid(),
  category    text          not null,
  description text          not null,
  amount      numeric(12,2) not null check (amount > 0),
  date        date          not null,
  provider    text,
  notes       text,
  created_by  uuid          references auth.users(id) on delete set null,
  created_at  timestamptz   not null default now()
);

-- ── customers ─────────────────────────────────────────────────────────────────
create table public.customers (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text,
  phone       text,
  company     text,
  notes       text,
  user_id     uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.customers is 'Leads y clientes del flujo de cotización público. Anon puede insertar.';

-- ── quotes ────────────────────────────────────────────────────────────────────
create table public.quotes (
  id              uuid          primary key default gen_random_uuid(),
  customer_id     uuid          not null references public.customers(id) on delete cascade,
  status          text          not null default 'nueva'
                                check (status in ('nueva','contactada','enviada','ganada','perdida')),
  total_estimate  numeric(12,2) not null default 0,
  notes           text,
  admin_notes     text,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);
comment on table public.quotes is 'Cotizaciones generadas desde el catálogo. admin_notes es confidencial.';

-- ── quote_items ───────────────────────────────────────────────────────────────
create table public.quote_items (
  id            uuid          primary key default gen_random_uuid(),
  quote_id      uuid          not null references public.quotes(id) on delete cascade,
  product_id    uuid          references public.products(id) on delete set null,
  product_name  text          not null,
  product_sku   text          not null,
  unit_price    numeric(12,2) not null,
  quantity      integer       not null check (quantity > 0),
  subtotal      numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz   not null default now()
);

-- ── sales ─────────────────────────────────────────────────────────────────────
create table public.sales (
  id            uuid          primary key default gen_random_uuid(),
  customer_id   uuid          references public.customers(id) on delete set null,
  quote_id      uuid          references public.quotes(id) on delete set null,
  total_amount  numeric(12,2) not null,
  items         jsonb         not null default '[]',
  status        text          not null default 'completed'
                              check (status in ('completed','cancelled','refunded')),
  notes         text,
  created_by    uuid          references auth.users(id) on delete set null,
  created_at    timestamptz   not null default now()
);
comment on table public.sales is 'Ventas cerradas manualmente por admin. Sin checkout público.';

-- ── inventory_movements ───────────────────────────────────────────────────────
create table public.inventory_movements (
  id              uuid        primary key default gen_random_uuid(),
  product_id      uuid        not null references public.products(id) on delete restrict,
  movement_type   text        not null check (movement_type in ('in','out','adjustment')),
  quantity_change integer     not null,
  reason          text,
  reference_id    text,
  created_by      uuid        references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3: FUNCIONES QUE DEPENDEN DE TABLAS
-- Estas funciones referencian public.profiles — deben ir DESPUÉS de crearla.
-- ─────────────────────────────────────────────────────────────────────────────

-- is_admin(): verifica si el usuario actual tiene rol admin en su perfil.
-- SECURITY INVOKER: el subquery a profiles está sujeto a RLS de profiles.
-- El usuario siempre puede leer SU propia fila (política select_own), por lo que
-- esta función funciona correctamente para verificar el propio rol.
-- Uso: en políticas de tablas distintas a profiles (sin riesgo de recursión).
create or replace function public.is_admin()
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
    and role = 'admin'
  );
$$;

-- prevent_role_escalation(): bloquea cambios de rol desde el cliente.
-- Solo service_role / postgres pueden cambiar roles.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security invoker
as $$
begin
  if old.role is distinct from new.role then
    if current_setting('role', true) not in ('service_role', 'postgres', 'supabase_admin') then
      raise exception
        'Cambio de rol no permitido desde el cliente. Contacta al administrador.';
    end if;
  end if;
  return new;
end;
$$;

-- handle_new_user(): crea perfil automáticamente al registrar un usuario.
-- SECURITY DEFINER con search_path vacío — patrón oficial de Supabase para
-- triggers en auth.users. Fuerza role='client'; solo service_role puede promover.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Revocar EXECUTE de PUBLIC — handle_new_user es SECURITY DEFINER y no debe
-- ser invocable directamente por clientes anónimos o autenticados.
revoke execute on function public.handle_new_user() from public;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 4: TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

create trigger trg_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_updated_at_products
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger trg_updated_at_employees
  before update on public.employees
  for each row execute function public.set_updated_at();

create trigger trg_updated_at_customers
  before update on public.customers
  for each row execute function public.set_updated_at();

create trigger trg_updated_at_quotes
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- Bloqueo de auto-promoción de rol
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute function public.prevent_role_escalation();

-- Creación automática de perfil al registrar usuario en Supabase Auth
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 5: HABILITAR ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles            enable row level security;
alter table public.products            enable row level security;
alter table public.employees           enable row level security;
alter table public.payroll             enable row level security;
alter table public.expenses            enable row level security;
alter table public.customers           enable row level security;
alter table public.quotes              enable row level security;
alter table public.quote_items         enable row level security;
alter table public.sales               enable row level security;
alter table public.inventory_movements enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 6: POLÍTICAS RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────────────────────────
-- NOTA: políticas de profiles NO pueden usar is_admin() — causaría recursión.
--       Solo se usa auth.uid() = id para verificar identidad propia.

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

-- Insert forzado a role='client' — el trigger handle_new_user ya lo hace,
-- esta política es defensa adicional contra inserts directos vía API.
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = id
    and role = 'client'
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using      ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- ── products ──────────────────────────────────────────────────────────────────

-- Catálogo público: anon y authenticated leen productos activos
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using ( active = true );

-- Admin lee también productos inactivos (para gestión de inventario)
create policy "products_select_admin_all"
  on public.products for select
  to authenticated
  using ( public.is_admin() );

create policy "products_insert_admin"
  on public.products for insert
  to authenticated
  with check ( public.is_admin() );

create policy "products_update_admin"
  on public.products for update
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

create policy "products_delete_admin"
  on public.products for delete
  to authenticated
  using ( public.is_admin() );

-- ── employees ─────────────────────────────────────────────────────────────────

create policy "employees_admin_all"
  on public.employees for all
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

-- ── payroll ───────────────────────────────────────────────────────────────────

create policy "payroll_admin_all"
  on public.payroll for all
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

-- ── expenses ──────────────────────────────────────────────────────────────────

create policy "expenses_admin_all"
  on public.expenses for all
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

-- ── customers ─────────────────────────────────────────────────────────────────

create policy "customers_insert_public"
  on public.customers for insert
  to anon, authenticated
  with check ( true );

create policy "customers_select_own_or_admin"
  on public.customers for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin()
  );

create policy "customers_update_admin"
  on public.customers for update
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

create policy "customers_delete_admin"
  on public.customers for delete
  to authenticated
  using ( public.is_admin() );

-- ── quotes ────────────────────────────────────────────────────────────────────

create policy "quotes_insert_public"
  on public.quotes for insert
  to anon, authenticated
  with check ( true );

create policy "quotes_select_admin"
  on public.quotes for select
  to authenticated
  using ( public.is_admin() );

create policy "quotes_update_admin"
  on public.quotes for update
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

-- ── quote_items ───────────────────────────────────────────────────────────────

create policy "quote_items_insert_public"
  on public.quote_items for insert
  to anon, authenticated
  with check ( true );

create policy "quote_items_select_admin"
  on public.quote_items for select
  to authenticated
  using ( public.is_admin() );

create policy "quote_items_write_admin"
  on public.quote_items for all
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

-- ── sales ─────────────────────────────────────────────────────────────────────

create policy "sales_admin_all"
  on public.sales for all
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

-- ── inventory_movements ───────────────────────────────────────────────────────

create policy "inventory_movements_admin_all"
  on public.inventory_movements for all
  to authenticated
  using      ( public.is_admin() )
  with check ( public.is_admin() );

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 7: GRANTS
-- Requerido desde Supabase abril 2026 — nuevas tablas no se exponen
-- al Data API automáticamente.
-- ─────────────────────────────────────────────────────────────────────────────

-- anon puede leer el catálogo público
grant select on public.products to anon;

-- anon puede insertar en el flujo de cotización (sin cuenta requerida)
grant insert on public.customers   to anon;
grant insert on public.quotes      to anon;
grant insert on public.quote_items to anon;

-- authenticated tiene acceso completo (RLS restringe filas)
grant select, insert, update, delete on public.profiles            to authenticated;
grant select, insert, update, delete on public.products            to authenticated;
grant select, insert, update, delete on public.employees           to authenticated;
grant select, insert, update, delete on public.payroll             to authenticated;
grant select, insert, update, delete on public.expenses            to authenticated;
grant select, insert, update, delete on public.customers           to authenticated;
grant select, insert, update, delete on public.quotes              to authenticated;
grant select, insert, update, delete on public.quote_items         to authenticated;
grant select, insert, update, delete on public.sales               to authenticated;
grant select, insert, update, delete on public.inventory_movements to authenticated;

-- funciones
grant execute on function public.is_admin()       to authenticated;
grant execute on function public.set_updated_at() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 8: ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────────

create index idx_products_sku        on public.products(sku);
create index idx_products_category   on public.products(category);
create index idx_products_active     on public.products(active);

create index idx_payroll_employee    on public.payroll(employee_id);
create index idx_payroll_period      on public.payroll(period);

create index idx_customers_user_id   on public.customers(user_id);
create index idx_customers_email     on public.customers(email);

create index idx_quotes_customer_id  on public.quotes(customer_id);
create index idx_quotes_status       on public.quotes(status);
create index idx_quotes_created_at   on public.quotes(created_at desc);

create index idx_quote_items_quote   on public.quote_items(quote_id);
create index idx_quote_items_product on public.quote_items(product_id);

create index idx_sales_customer      on public.sales(customer_id);
create index idx_sales_quote         on public.sales(quote_id);
create index idx_sales_created_at    on public.sales(created_at desc);

create index idx_inv_mov_product     on public.inventory_movements(product_id);
create index idx_inv_mov_created_at  on public.inventory_movements(created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN POST-APLICACIÓN
-- Copia y ejecuta en SQL Editor para confirmar estado:
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Tablas con RLS habilitado:
--    select tablename, rowsecurity from pg_tables
--    where schemaname = 'public' order by tablename;
--
-- 2. Políticas creadas:
--    select tablename, policyname, cmd, roles
--    from pg_policies where schemaname = 'public'
--    order by tablename, policyname;
--
-- 3. Trigger de auth (debe aparecer on_auth_user_created):
--    select trigger_name, event_object_table
--    from information_schema.triggers
--    where trigger_schema = 'auth';
--
-- =============================================================================
