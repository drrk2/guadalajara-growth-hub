# Migraciones EISEN — Cómo aplicar

## Orden de aplicación

1. `20260628000001_rls_existing_tables.sql` — RLS en tablas existentes
2. `20260628000002_quote_flow_tables.sql` — Tablas nuevas para flujo de cotización

## Cómo aplicarlas (Supabase Dashboard)

1. Ve a **Supabase Dashboard > SQL Editor**
2. Pega el contenido de cada archivo **en orden**
3. Haz click en **Run**
4. Verifica que no haya errores

## Cómo aplicarlas (Supabase CLI — cuando esté instalado)

```bash
# Instalar CLI
npm install -g supabase

# Enlazar proyecto
supabase link --project-ref <tu-project-ref>

# Aplicar migraciones
supabase db push
```

## Notas importantes

- Todas las migraciones usan `IF NOT EXISTS` — son seguras de re-ejecutar
- **Ninguna migración hace DROP** de tablas, columnas o datos existentes
- Las políticas RLS usan `DROP POLICY IF EXISTS` + `CREATE POLICY` para ser idempotentes
- La columna `subtotal` en `quote_items` es computed (`generated always as`) — Postgres la calcula automáticamente

## Verificación post-aplicación

Ejecuta en SQL Editor para confirmar:

```sql
-- Verifica RLS habilitado en tablas existentes
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Verifica políticas creadas
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Verifica tablas nuevas
select table_name
from information_schema.tables
where table_schema = 'public'
and table_name in ('customers', 'quotes', 'quote_items', 'inventory_movements');
```

## Rotar credenciales (URGENTE)

Si las credenciales de Supabase estuvieron en git, rótalas:
1. Supabase Dashboard → **Project Settings → API**
2. Haz click en **Rotate key** junto a la anon key
3. Actualiza tu archivo `.env` local con las nuevas claves
