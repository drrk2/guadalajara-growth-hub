-- =============================================================================
-- 0003_add_employee_email.sql
-- Añade columna email a la tabla employees.
--
-- Aplicar DESPUÉS de 0001 y 0002.
-- Idempotente: usa IF NOT EXISTS.
-- =============================================================================

alter table public.employees
  add column if not exists email text;

-- No es unique porque puede haber empleados sin correo o con el mismo correo
-- corporativo genérico. Si se quiere unique en el futuro, requiere limpieza previa.

-- Comentario en tabla
comment on column public.employees.email is 'Correo de contacto del colaborador. Opcional, no único.';
