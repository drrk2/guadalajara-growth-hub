-- Campos de nómina en employees.
-- Aplica en Supabase SQL Editor → revisa antes de ejecutar.

alter table public.employees
  add column if not exists payroll_enabled boolean not null default true;
