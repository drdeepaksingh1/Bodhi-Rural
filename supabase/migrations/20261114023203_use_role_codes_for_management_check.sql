-- Resolve management authorization by stable role codes instead of hard-coded role UUIDs.
-- The current role UUIDs map to these same six codes; this preserves current
-- authorization while avoiding drift if role records are recreated.
create or replace function public.is_bodhi_management_user()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and p.is_active = true
      and r.code in (
        'SUPER_ADMIN',
        'CEO',
        'CORPORATE_ADMIN',
        'STATE_MANAGER',
        'DISTRICT_MANAGER',
        'BLOCK_MANAGER'
      )
  );
$function$;