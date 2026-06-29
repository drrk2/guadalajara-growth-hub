-- =============================================================================
-- Migration: 20260628000001_rls_existing_tables.sql
-- Purpose : Enable RLS and add secure policies to tables already in production.
--           Safe to run on existing data: uses IF NOT EXISTS / idempotent drops.
-- Review  : Run the introspection query in 00_introspect_before_apply.sql first.
-- Apply   : Supabase Dashboard > SQL Editor — run AFTER verifying column names.
-- =============================================================================
--
-- DESIGN NOTE — Admin role check pattern:
--   Tables OTHER than profiles can safely use:
--     exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
--   The profiles table itself CANNOT query itself in its own policy (infinite recursion).
--   Fix: profiles policies use only auth.uid() = id (own-row check).
--   Admin access to all profiles rows must go via Supabase Dashboard or a
--   service-role Edge Function. This is the recommended pattern until role is
--   moved to JWT app_metadata claims (future migration).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: profiles
-- CRITICAL: no subquery to profiles inside profiles policies (recursion).
-- Admin "see-all" for profiles will be handled via service-role Edge Function.
-- ---------------------------------------------------------------------------

alter table if exists public.profiles enable row level security;

-- Any authenticated user reads their own profile row only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

-- New users can insert their own profile — forced to role='client', no self-promotion
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = id
    and role = 'client'
  );

-- Users can update their own profile fields — role column is protected by trigger below
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- Trigger: prevent any client-side role change (only service_role can change roles)
-- This avoids the need to query profiles from within a profiles policy.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security invoker
as $$
begin
  -- auth.role() is deprecated; check via pg session setting injected by Supabase
  -- service_role bypasses RLS, so reaching this trigger as service_role is fine
  if old.role is distinct from new.role then
    -- Only allow role change if caller is using service_role (RLS bypassed = service_role)
    -- Since this trigger runs with SECURITY INVOKER and RLS is enabled on profiles,
    -- a normal authenticated user cannot change their role via the API.
    -- This trigger adds defense-in-depth for direct DB access scenarios.
    if current_setting('role', true) not in ('service_role', 'postgres', 'supabase_admin') then
      raise exception 'Role changes are not allowed via the client API. Contact your administrator.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute function public.prevent_role_self_escalation();

-- ---------------------------------------------------------------------------
-- HELPER: is_admin() — checks if current user is admin via profiles lookup
-- Used safely in policies for tables OTHER than profiles (no recursion risk).
-- SECURITY INVOKER: runs as the calling user, subject to profiles RLS.
-- Note: since profiles_select_own only allows own-row, this function works
-- because auth.uid() = profiles.id means the user can read their own role.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- TABLE: products  (public catalog — anon read, admin write)
-- ---------------------------------------------------------------------------

alter table if exists public.products enable row level security;

-- Public catalog: anyone can browse
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (true);

-- Only admin can modify product catalog
drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin"
  on public.products for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABLE: employees  (EISEN staff records — admin only)
-- ---------------------------------------------------------------------------

alter table if exists public.employees enable row level security;

drop policy if exists "employees_admin_all" on public.employees;
create policy "employees_admin_all"
  on public.employees for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABLE: payroll
-- ---------------------------------------------------------------------------

alter table if exists public.payroll enable row level security;

drop policy if exists "payroll_admin_all" on public.payroll;
create policy "payroll_admin_all"
  on public.payroll for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABLE: expenses
-- ---------------------------------------------------------------------------

alter table if exists public.expenses enable row level security;

drop policy if exists "expenses_admin_all" on public.expenses;
create policy "expenses_admin_all"
  on public.expenses for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- TABLE: sales
-- ---------------------------------------------------------------------------

alter table if exists public.sales enable row level security;

drop policy if exists "sales_admin_all" on public.sales;
create policy "sales_admin_all"
  on public.sales for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------------------------------------------------------------------------
-- GRANTS: expose existing tables to Data API (required since Supabase April 2026)
-- These are additive — safe if grants already exist.
-- ---------------------------------------------------------------------------

-- products: anon can read (public catalog)
grant select on public.products to anon;

-- authenticated gets access; RLS controls row-level restrictions
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.payroll to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.sales to authenticated;

-- Grant execute on helper function
grant execute on function public.is_admin() to authenticated;
