-- =============================================================================
-- 0004_remove_product_cost.sql
-- Elimina la columna `cost` de la tabla `products`.
--
-- Motivo: `products` tiene política SELECT para anon (catálogo público).
-- El costo de compra no debe exponerse a visitantes. Si en el futuro se
-- necesita registrar costos, se creará una tabla/vista admin-only separada.
--
-- Aplicar DESPUÉS de 0001. Puede aplicarse antes o después de 0002/0003.
-- =============================================================================

alter table public.products
  drop column if exists cost;

comment on table public.products is
  'Catálogo público de refacciones. No contiene datos de costo — ver tabla admin_product_costs (futura).';
