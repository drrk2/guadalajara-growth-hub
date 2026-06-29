-- Habilitar Realtime para tablas clave en la publicación supabase_realtime.
-- products ya puede estar en la publicación (SystemContext lo usa). Agregar las demás es seguro;
-- Postgres ignora el error si la tabla ya está incluida con IF NOT EXISTS (PG16+).
-- En PG < 16 o Supabase Cloud: si ya está, el comando falla con un error inofensivo.
-- Aplica en el SQL Editor de Supabase (Dashboard → SQL Editor → New query).

-- Verifica el estado actual primero (opcional):
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

alter publication supabase_realtime add table public.quotes;
alter publication supabase_realtime add table public.quote_items;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.employees;

-- products: SystemContext ya tiene un canal activo para products.
-- Si aún no está en la publicación, agrégalo también:
-- alter publication supabase_realtime add table public.products;
