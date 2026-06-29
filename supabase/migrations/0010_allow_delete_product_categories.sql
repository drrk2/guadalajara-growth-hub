-- Permite que admin elimine categorías desde el dashboard.
-- La validación de que la categoría no tenga productos asignados se hace
-- en el frontend antes de llamar delete (opción 1: bloquear si tiene productos).

create policy "categories_delete_admin"
  on public.product_categories
  for delete
  to authenticated
  using (public.is_admin());

grant delete on public.product_categories to authenticated;
