-- Categorías de producto administrables.
-- Aplica en Supabase SQL Editor → revisa antes de ejecutar.
--
-- Qué hace este script:
--   1. Crea tabla product_categories
--   2. Migra los valores distintos de products.category a la nueva tabla
--   3. Agrega columna category_id a products y la puebla por nombre
--   4. Crea índices, activa RLS y define policies
--   5. Agrega la tabla a la publicación realtime

-- ── 1. Tabla ─────────────────────────────────────────────────────────────────

create table if not exists public.product_categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        unique,
  description text,
  active      boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Reutiliza la función set_updated_at() del baseline
create trigger product_categories_updated_at
  before update on public.product_categories
  for each row execute procedure public.set_updated_at();

-- ── 2. Poblar desde products.category ────────────────────────────────────────

insert into public.product_categories (name, slug, sort_order)
select
  cat,
  lower(regexp_replace(trim(cat), '[^a-zA-Z0-9]+', '-', 'g')),
  (row_number() over (order by cat) - 1) * 10
from (
  select distinct category as cat
  from   public.products
  where  category is not null
    and  trim(category) <> ''
) t
on conflict (slug) do nothing;

-- ── 3. FK en products ─────────────────────────────────────────────────────────

alter table public.products
  add column if not exists category_id uuid references public.product_categories(id);

-- Poblar category_id para productos existentes
update public.products p
set    category_id = pc.id
from   public.product_categories pc
where  pc.name = p.category
  and  p.category_id is null;

-- ── 4. Índices ────────────────────────────────────────────────────────────────

create index if not exists products_category_id_idx
  on public.products (category_id);

create index if not exists product_categories_active_sort_idx
  on public.product_categories (active, sort_order);

-- ── 5. RLS ───────────────────────────────────────────────────────────────────

alter table public.product_categories enable row level security;

-- anon: solo categorías activas
create policy "categories_select_anon"
  on public.product_categories
  for select
  to anon
  using (active = true);

-- authenticated: admin ve todas; otros solo activas
create policy "categories_select_authenticated"
  on public.product_categories
  for select
  to authenticated
  using (active = true or public.is_admin());

-- admin: insertar
create policy "categories_insert_admin"
  on public.product_categories
  for insert
  to authenticated
  with check (public.is_admin());

-- admin: actualizar
create policy "categories_update_admin"
  on public.product_categories
  for update
  to authenticated
  using (public.is_admin());

-- Permisos
grant select             on public.product_categories to anon, authenticated;
grant insert, update     on public.product_categories to authenticated;

-- ── 6. Realtime ──────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.product_categories;
