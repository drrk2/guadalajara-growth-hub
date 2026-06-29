-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 0014: RPCs de inventario transaccional desde cotizaciones
-- Aplica en Supabase SQL Editor → revisa antes de ejecutar.
-- No modifica tablas; solo crea funciones e índice.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── close_quote_as_sale ───────────────────────────────────────────────────────
-- Cierra una cotización como venta:
--   · Valida stock item por item antes de tocar nada.
--   · Inserta en sales + inventory_movements.
--   · Descuenta stock en products.
--   · Cambia quotes.status = 'ganada'.
--   · Todo atómico dentro de la función.

create or replace function public.close_quote_as_sale(p_quote_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote         record;
  v_item          record;
  v_sale_id       uuid;
  v_items_json    jsonb;
  v_current_stock integer;
begin
  -- Solo admins
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden cerrar ventas';
  end if;

  -- Leer cotización
  select * into strict v_quote
  from public.quotes
  where id = p_quote_id;

  -- Evitar doble cierre
  if v_quote.status = 'ganada' then
    raise exception 'Esta cotización ya está marcada como venta cerrada';
  end if;

  -- Evitar venta duplicada
  if exists (
    select 1 from public.sales
    where quote_id = p_quote_id and status = 'completed'
  ) then
    raise exception 'Ya existe una venta completada para esta cotización';
  end if;

  -- Validación de stock (falla rápido en el primer producto sin stock suficiente)
  for v_item in
    select qi.product_id, qi.product_name, qi.quantity
    from public.quote_items qi
    where qi.quote_id = p_quote_id
      and qi.product_id is not null
  loop
    select stock into v_current_stock
    from public.products
    where id = v_item.product_id;

    if not found or v_current_stock < v_item.quantity then
      raise exception 'Stock insuficiente para "%". Disponible: %, requerido: %',
        v_item.product_name,
        coalesce(v_current_stock, 0),
        v_item.quantity;
    end if;
  end loop;

  -- Snapshot de ítems para la venta (captura precios en el momento del cierre)
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id',   qi.product_id,
    'product_name', qi.product_name,
    'product_sku',  qi.product_sku,
    'quantity',     qi.quantity,
    'unit_price',   qi.unit_price,
    'subtotal',     qi.subtotal
  )), '[]'::jsonb)
  into v_items_json
  from public.quote_items qi
  where qi.quote_id = p_quote_id;

  -- Insertar venta
  insert into public.sales (customer_id, quote_id, total_amount, items, status, created_by)
  values (
    v_quote.customer_id,
    p_quote_id,
    v_quote.total_estimate,
    v_items_json,
    'completed',
    auth.uid()
  )
  returning id into v_sale_id;

  -- Descontar stock + registrar movimientos
  for v_item in
    select qi.product_id, qi.product_name, qi.quantity
    from public.quote_items qi
    where qi.quote_id = p_quote_id
      and qi.product_id is not null
  loop
    update public.products
    set stock = stock - v_item.quantity
    where id = v_item.product_id;

    insert into public.inventory_movements
      (product_id, movement_type, quantity_change, reason, reference_id, created_by)
    values
      (v_item.product_id, 'out', -v_item.quantity, 'quote_won', v_sale_id::text, auth.uid());
  end loop;

  -- Marcar cotización como ganada
  update public.quotes
  set status = 'ganada', updated_at = now()
  where id = p_quote_id;

  return jsonb_build_object('sale_id', v_sale_id);
end;
$$;

-- ── cancel_quote_sale ─────────────────────────────────────────────────────────
-- Cancela una cotización (marcándola como "perdida"):
--   · Si existe una venta completed y p_restore_stock = true: restaura stock.
--   · Cambia sales.status = 'cancelled' (si había venta).
--   · Cambia quotes.status = 'perdida'.
--   · Si no había venta cerrada, solo marca la quote.

create or replace function public.cancel_quote_sale(
  p_quote_id      uuid,
  p_restore_stock boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale   record;
  v_item   record;
  v_prod_id uuid;
  v_qty    integer;
begin
  -- Solo admins
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden cancelar ventas';
  end if;

  -- Buscar venta completada para esta cotización
  select * into v_sale
  from public.sales
  where quote_id = p_quote_id and status = 'completed'
  limit 1;

  if found then
    if p_restore_stock then
      -- Restaurar stock desde el snapshot de items de la venta
      for v_item in
        select
          (elem->>'product_id')::uuid as product_id,
          (elem->>'quantity')::integer as quantity
        from jsonb_array_elements(v_sale.items) as elem
        where elem->>'product_id' is not null
      loop
        update public.products
        set stock = stock + v_item.quantity
        where id = v_item.product_id;

        insert into public.inventory_movements
          (product_id, movement_type, quantity_change, reason, reference_id, created_by)
        values
          (v_item.product_id, 'in', v_item.quantity, 'quote_cancelled_restore', v_sale.id::text, auth.uid());
      end loop;
    end if;

    -- Cancelar la venta
    update public.sales
    set status = 'cancelled'
    where id = v_sale.id;
  end if;

  -- Marcar cotización como perdida
  update public.quotes
  set status = 'perdida', updated_at = now()
  where id = p_quote_id;
end;
$$;

-- ── Índice único ──────────────────────────────────────────────────────────────
-- Una sola venta por cotización (previene race conditions en el frontend).

create unique index if not exists sales_quote_id_unique
  on public.sales(quote_id)
  where quote_id is not null;

-- ── Grants ────────────────────────────────────────────────────────────────────

grant execute on function public.close_quote_as_sale(uuid)          to authenticated;
grant execute on function public.cancel_quote_sale(uuid, boolean)   to authenticated;
