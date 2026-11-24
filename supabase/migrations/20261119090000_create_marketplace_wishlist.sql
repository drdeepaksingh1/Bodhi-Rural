create table if not exists public.marketplace_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.marketplace_products (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint marketplace_wishlist_items_user_product_key
    unique (user_id, product_id)
);

alter table public.marketplace_wishlist_items enable row level security;

revoke all on table public.marketplace_wishlist_items from public, anon, authenticated;
grant select, insert, delete on table public.marketplace_wishlist_items to authenticated;

drop policy if exists "Shoppers read their own wishlist items"
  on public.marketplace_wishlist_items;
create policy "Shoppers read their own wishlist items"
  on public.marketplace_wishlist_items
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Shoppers add their own wishlist items"
  on public.marketplace_wishlist_items;
create policy "Shoppers add their own wishlist items"
  on public.marketplace_wishlist_items
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Shoppers remove their own wishlist items"
  on public.marketplace_wishlist_items;
create policy "Shoppers remove their own wishlist items"
  on public.marketplace_wishlist_items
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
