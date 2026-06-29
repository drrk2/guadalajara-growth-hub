-- Storage bucket para imágenes de productos.
-- Aplica en Supabase SQL Editor → revisa antes de ejecutar.
--
-- Valida después con:
--   select id, public, file_size_limit, allowed_mime_types
--   from storage.buckets where id = 'products';
--
--   select policyname, cmd, roles from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--   and policyname like 'product_images%' order by policyname;

-- ── 1. Bucket ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public             = true,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── 2. Policies en storage.objects ───────────────────────────────────────────

-- Lectura pública (anon + authenticated)
drop policy if exists "product_images_select_public" on storage.objects;
create policy "product_images_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'products');

-- Subida: solo admin autenticado
drop policy if exists "product_images_insert_admin" on storage.objects;
create policy "product_images_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products' and public.is_admin());

-- Actualización: solo admin autenticado
drop policy if exists "product_images_update_admin" on storage.objects;
create policy "product_images_update_admin"
  on storage.objects for update
  to authenticated
  using     (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

-- Eliminación: solo admin autenticado
drop policy if exists "product_images_delete_admin" on storage.objects;
create policy "product_images_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products' and public.is_admin());
