-- =============================================================================
-- 0005_fix_role_escalation_trigger.sql
-- Corrige public.prevent_role_escalation() para que permita cambios de
-- profiles.role desde el SQL Editor de Supabase y desde service_role,
-- pero lo bloquee desde cualquier cliente de la app React.
--
-- PROBLEMA ORIGINAL:
--   current_setting('role', true) devuelve '' cuando se ejecuta desde el
--   SQL Editor (el GUC 'role' no está configurado en esa sesión).
--   '' NOT IN ('postgres', 'supabase_admin', 'service_role') = TRUE
--   → trigger lanzaba excepción incluso para el dueño de la BD.
--
-- SOLUCIÓN:
--   Reemplazar current_setting('role', true) por current_user, que sí
--   refleja el rol Postgres efectivo:
--     • Supabase SQL Editor  → current_user = 'postgres'
--     • PostgREST autenticado → current_user = 'authenticated'  (bloqueado)
--     • PostgREST anon        → current_user = 'anon'            (bloqueado)
--     • Service role API      → current_user = 'service_role'   (permitido)
--
-- NO modifica: RLS, policies, estructura de profiles, roles disponibles.
-- =============================================================================

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security invoker
as $$
begin
  if old.role is distinct from new.role then
    if current_user not in ('postgres', 'supabase_admin', 'service_role') then
      raise exception
        'Cambio de rol no permitido desde el cliente. Solo un DBA o service_role puede cambiar roles de usuario.';
    end if;
  end if;
  return new;
end;
$$;

-- =============================================================================
-- VERIFICACIÓN: ejecutar en SQL Editor DESPUÉS de aplicar esta migración.
-- =============================================================================
--
-- 1. Promover usuario a admin (reemplaza el email):
--
--    update public.profiles p
--    set role = 'admin'
--    from auth.users u
--    where p.id = u.id
--    and lower(u.email) = lower('tu-correo@dominio.com')
--    returning u.email, p.role;
--
--    Resultado esperado: 1 fila con role = 'admin'.
--
-- 2. Confirmar que quedó como admin:
--
--    select u.email, p.role
--    from auth.users u
--    join public.profiles p on p.id = u.id
--    where lower(u.email) = lower('tu-correo@dominio.com');
--
--    Resultado esperado: email y role = 'admin'.
--
-- 3. Confirmar que la app bloquea auto-promoción (desde el cliente):
--    Intentar desde la consola del navegador:
--      supabase.from('profiles').update({ role: 'admin' }).eq('id', <tu-uuid>)
--    Debe devolver error 42501 con el mensaje del trigger.
-- =============================================================================
