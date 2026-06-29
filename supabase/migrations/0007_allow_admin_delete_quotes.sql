-- Allow admin to delete quotes.
-- quote_items cascade automatically via the FK on quote_items.quote_id.
-- The GRANT for DELETE on quotes to authenticated already exists in 0001_baseline_schema.sql.

create policy "quotes_delete_admin"
  on public.quotes
  for delete
  to authenticated
  using ( public.is_admin() );
