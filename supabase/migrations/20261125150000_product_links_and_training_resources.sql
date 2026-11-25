-- Let approved BodhiMart listings include a safe HTTPS reference URL.
alter table public.marketplace_products
  add column if not exists external_url text
  check (
    external_url is null
    or (external_url ~* '^https://' and char_length(external_url) <= 2000)
  );

grant select (external_url) on public.marketplace_products to anon, authenticated;
grant insert (external_url) on public.marketplace_products to authenticated;
grant update (external_url) on public.marketplace_products to authenticated;

create or replace view public.marketplace_public_products
with (security_barrier = true, security_invoker = true)
as
select
  p.id,
  p.product_id,
  p.sku,
  p.category_id,
  p.name,
  p.slug,
  p.description,
  p.brand,
  p.unit,
  p.weight,
  p.mrp,
  p.selling_price,
  p.tax_percent,
  p.minimum_order_quantity,
  p.maximum_order_quantity,
  p.delivery_available,
  p.status,
  p.created_at,
  p.image_url,
  p.image_gallery,
  p.external_url
from public.marketplace_products as p
where p.status = 'ACTIVE'
  and private.is_public_marketplace_product(p.id);

comment on view public.marketplace_public_products is
  'Shopper-safe marketplace product fields for active products from active sellers.';

create table public.skills_training_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  skill_area text not null check (char_length(trim(skill_area)) between 2 and 80),
  description text not null check (char_length(trim(description)) between 10 and 1200),
  video_url text check (video_url is null or (video_url ~* '^https://' and char_length(video_url) <= 2000)),
  meeting_url text check (meeting_url is null or (meeting_url ~* '^https://' and char_length(meeting_url) <= 2000)),
  session_at timestamptz,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_training_resources_has_link check (video_url is not null or meeting_url is not null)
);

create index skills_training_resources_published_session_idx
  on public.skills_training_resources (status, session_at nulls last, created_at desc);

alter table public.skills_training_resources enable row level security;

grant select on public.skills_training_resources to anon, authenticated;
grant insert, update, delete on public.skills_training_resources to authenticated;

create policy "Published training resources are public"
  on public.skills_training_resources
  for select
  to anon, authenticated
  using (status = 'PUBLISHED');

create policy "Management can view all training resources"
  on public.skills_training_resources
  for select
  to authenticated
  using (public.is_bodhi_management_user());

create policy "Management can add training resources"
  on public.skills_training_resources
  for insert
  to authenticated
  with check (
    public.is_bodhi_management_user()
    and created_by = (select auth.uid())
  );

create policy "Management can update training resources"
  on public.skills_training_resources
  for update
  to authenticated
  using (public.is_bodhi_management_user())
  with check (public.is_bodhi_management_user());

create policy "Management can delete training resources"
  on public.skills_training_resources
  for delete
  to authenticated
  using (public.is_bodhi_management_user());

