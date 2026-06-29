-- Vista de resumen de clientes con estadísticas de cotizaciones.
-- Aplica en Supabase SQL Editor → revisa antes de ejecutar.
-- No modifica tablas existentes.

create or replace view public.customer_quote_summary
  with (security_invoker = true)
as
select
  c.id,
  c.name,
  c.email,
  c.phone,
  c.company,
  c.notes,
  c.created_at,
  c.updated_at,
  count(q.id)                                               as quote_count,
  coalesce(sum(q.total_estimate), 0)                        as total_quoted,
  max(q.created_at)                                         as last_quote_at,
  -- Status de la cotización más reciente
  (
    select q2.status
    from   public.quotes q2
    where  q2.customer_id = c.id
    order  by q2.created_at desc
    limit  1
  )                                                         as last_quote_status,
  count(q.id) filter (where q.status = 'nueva')             as nueva_count,
  count(q.id) filter (where q.status = 'contactada')        as contactada_count,
  count(q.id) filter (where q.status = 'enviada')           as enviada_count,
  count(q.id) filter (where q.status = 'ganada')            as ganada_count,
  count(q.id) filter (where q.status = 'perdida')           as perdida_count
from   public.customers c
left   join public.quotes q on q.customer_id = c.id
group  by c.id, c.name, c.email, c.phone, c.company, c.notes, c.created_at, c.updated_at;

-- Solo admins autenticados — la view hereda RLS de customers/quotes (security_invoker)
grant select on public.customer_quote_summary to authenticated;
