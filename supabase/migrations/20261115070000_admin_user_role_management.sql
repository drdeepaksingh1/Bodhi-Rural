-- Restore administrative role changes through a narrowly authorized database boundary.
-- The browser never receives UPDATE privileges on protected profile columns.
create table if not exists public.admin_user_role_audit (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  target_profile_id uuid not null references public.profiles(id) on delete restrict,
  previous_values jsonb not null,
  new_values jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.admin_user_role_audit enable row level security;
revoke all privileges on table public.admin_user_role_audit from public;
revoke all privileges on table public.admin_user_role_audit from anon;
revoke all privileges on table public.admin_user_role_audit from authenticated;

create or replace function public.admin_update_user_role_assignment(
  p_target_user_id uuid,
  p_role_id uuid,
  p_location_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role_code text;
  v_target_role_code text;
  v_old_role_id uuid;
  v_old_location_id uuid;
  v_old_is_active boolean;
  v_location_type text;
  v_location_active boolean;
  v_parent_id uuid;
  v_parent_type text;
  v_parent_active boolean;
  v_grandparent_id uuid;
  v_grandparent_type text;
  v_grandparent_active boolean;
begin
  if v_actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_target_user_id is null or p_role_id is null or p_is_active is null then
    raise exception 'Target user, role, and active status are required.';
  end if;

  if p_target_user_id = v_actor_id then
    raise exception 'Administrators cannot change their own role, location, or active status.';
  end if;

  select r.code
    into v_actor_role_code
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = v_actor_id
    and p.is_active = true;

  if v_actor_role_code is null
     or v_actor_role_code not in ('SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN') then
    raise exception 'An active SUPER_ADMIN, CEO, or CORPORATE_ADMIN is required.';
  end if;

  select p.role_id, p.location_id, p.is_active
    into v_old_role_id, v_old_location_id, v_old_is_active
  from public.profiles p
  where p.id = p_target_user_id
  for update;

  if not found then
    raise exception 'Target user was not found.';
  end if;

  select r.code
    into v_target_role_code
  from public.roles r
  where r.id = p_role_id;

  if v_target_role_code is null then
    raise exception 'The selected role does not exist.';
  end if;

  -- Only SUPER_ADMIN may assign or modify privileged roles.
  if v_actor_role_code <> 'SUPER_ADMIN' then
    if v_target_role_code in ('SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN', 'FINANCE') then
      raise exception 'Only SUPER_ADMIN may assign privileged roles.';
    end if;

    if exists (
      select 1
      from public.roles current_role
      where current_role.id = v_old_role_id
        and current_role.code in ('SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN', 'FINANCE')
    ) then
      raise exception 'Only SUPER_ADMIN may modify a user who currently holds a privileged role.';
    end if;
  end if;

  -- Geographic roles must point to an active location of the matching type,
  -- with a valid active parent chain.
  if v_target_role_code in ('STATE_MANAGER', 'DISTRICT_MANAGER', 'BLOCK_MANAGER') then
    if p_location_id is null then
      raise exception 'A geographic assignment is required for this role.';
    end if;

    select l.location_type, l.is_active, l.parent_id
      into v_location_type, v_location_active, v_parent_id
    from public.locations l
    where l.id = p_location_id;

    if not found or coalesce(v_location_active, false) is not true then
      raise exception 'The selected geographic location is missing or inactive.';
    end if;

    if v_target_role_code = 'STATE_MANAGER' and v_location_type <> 'STATE' then
      raise exception 'STATE_MANAGER must be assigned to a STATE location.';
    elsif v_target_role_code = 'DISTRICT_MANAGER' then
      if v_location_type <> 'DISTRICT' or v_parent_id is null then
        raise exception 'DISTRICT_MANAGER must be assigned to a DISTRICT location.';
      end if;

      select l.location_type, l.is_active
        into v_parent_type, v_parent_active
      from public.locations l
      where l.id = v_parent_id;

      if not found or v_parent_type <> 'STATE' or coalesce(v_parent_active, false) is not true then
        raise exception 'The selected district must belong to an active state.';
      end if;
    elsif v_target_role_code = 'BLOCK_MANAGER' then
      if v_location_type <> 'BLOCK' or v_parent_id is null then
        raise exception 'BLOCK_MANAGER must be assigned to a BLOCK location.';
      end if;

      select l.location_type, l.is_active, l.parent_id
        into v_parent_type, v_parent_active, v_grandparent_id
      from public.locations l
      where l.id = v_parent_id;

      if not found or v_parent_type <> 'DISTRICT' or coalesce(v_parent_active, false) is not true
         or v_grandparent_id is null then
        raise exception 'The selected block must belong to an active district.';
      end if;

      select l.location_type, l.is_active
        into v_grandparent_type, v_grandparent_active
      from public.locations l
      where l.id = v_grandparent_id;

      if not found or v_grandparent_type <> 'STATE' or coalesce(v_grandparent_active, false) is not true then
        raise exception 'The selected block must belong to a district in an active state.';
      end if;
    end if;
  elsif p_location_id is not null then
    raise exception 'Non-geographic roles must not have a geographic location assignment.';
  end if;

  update public.profiles
  set role_id = p_role_id,
      location_id = p_location_id,
      is_active = p_is_active,
      updated_at = now()
  where id = p_target_user_id;

  insert into public.admin_user_role_audit (
    actor_profile_id,
    target_profile_id,
    previous_values,
    new_values
  )
  values (
    v_actor_id,
    p_target_user_id,
    jsonb_build_object(
      'role_id', v_old_role_id,
      'location_id', v_old_location_id,
      'is_active', v_old_is_active
    ),
    jsonb_build_object(
      'role_id', p_role_id,
      'role_code', v_target_role_code,
      'location_id', p_location_id,
      'is_active', p_is_active
    )
  );
end;
$function$;

revoke all on function public.admin_update_user_role_assignment(uuid, uuid, uuid, boolean) from public;
revoke all on function public.admin_update_user_role_assignment(uuid, uuid, uuid, boolean) from anon;
grant execute on function public.admin_update_user_role_assignment(uuid, uuid, uuid, boolean) to authenticated;
