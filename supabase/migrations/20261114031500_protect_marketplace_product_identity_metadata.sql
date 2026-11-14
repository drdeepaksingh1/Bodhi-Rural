-- Prevent seller sessions from rewriting product identity and audit metadata.
-- Sellers may edit listing content and pricing, but product ownership and
-- approval provenance remain controlled by the database.
create or replace function public.enforce_marketplace_product_admin_status()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_is_super_admin boolean := false;
begin
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and p.is_active = true
      and r.code = 'SUPER_ADMIN'
  ) into v_is_super_admin;

  if v_is_super_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'PENDING';
    new.created_by := auth.uid();
    new.approved_by := null;
    new.approved_at := null;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.product_id is distinct from old.product_id
     or new.seller_id is distinct from old.seller_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Sellers cannot change product identity, ownership, or creation metadata.';
  end if;

  if new.status is distinct from old.status
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at then
    raise exception 'Only an active SUPER_ADMIN can change product listing status or approval metadata.';
  end if;

  return new;
end;
$function$;
