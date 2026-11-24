-- Public product photos are separate from private farmer documents.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'bodhimart-product-images',
  'bodhimart-product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Active BodhiMart sellers upload product photos"
  on storage.objects;
create policy "Active BodhiMart sellers upload product photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bodhimart-product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.marketplace_sellers s
    where s.user_id = auth.uid()
      and s.status = 'ACTIVE'
  )
);

drop policy if exists "Active BodhiMart sellers delete own product photos"
  on storage.objects;
create policy "Active BodhiMart sellers delete own product photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bodhimart-product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.marketplace_sellers s
    where s.user_id = auth.uid()
      and s.status = 'ACTIVE'
  )
);
