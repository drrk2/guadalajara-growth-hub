-- =============================================================================
-- PASO 0: Ejecuta este query ANTES de aplicar las migraciones.
-- Propósito: verificar el schema real de la BD para detectar diferencias
--            con lo que las migraciones asumen.
-- Dónde: Supabase Dashboard > SQL Editor
-- =============================================================================

-- 1. Columnas y tipos de tablas existentes
select
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length
from information_schema.tables t
join information_schema.columns c
  on t.table_name = c.table_name and t.table_schema = c.table_schema
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and t.table_name in ('profiles', 'products', 'employees', 'payroll', 'expenses', 'sales')
order by t.table_name, c.ordinal_position;

-- 2. ¿Qué tablas ya existen en public?
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

-- 3. ¿RLS ya está habilitado en alguna tabla?
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 4. Políticas RLS existentes (si ya hay alguna)
select tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5. Índices existentes (para no duplicar en migration 002)
select indexname, tablename, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
