-- Agrega campos de entrega/envío a la tabla de cotizaciones.
-- delivery_type: 'delivery' (envío) o 'pickup' (recoger en sucursal).
-- Los demás campos son opcionales; aplican principalmente cuando delivery_type = 'delivery'.

alter table public.quotes
  add column if not exists delivery_type    text not null default 'delivery'
    check (delivery_type in ('delivery', 'pickup')),
  add column if not exists delivery_address text,
  add column if not exists delivery_city    text,
  add column if not exists delivery_zip     text,
  add column if not exists delivery_notes   text;
