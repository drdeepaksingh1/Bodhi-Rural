-- The locations model has no CLUSTER type. Cluster supervisors are assigned
-- to a PANCHAYAT or BLOCK, so farm-data RLS must use the corresponding farmer
-- geography fields rather than comparing the assignment to farmers.cluster_id.
create or replace function public.farmer_in_user_scope(p_farmer_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
declare
    v_role text;
    v_location uuid;
    v_location_type text;
    v_user uuid;
    v_farmer_user uuid;
    v_farmer_leader uuid;
    v_state uuid;
    v_district uuid;
    v_block uuid;
    v_panchayat uuid;
begin
    v_user := auth.uid();

    if v_user is null then
        return false;
    end if;

    select
        public.current_user_role_code(),
        public.current_user_location_id()
    into
        v_role,
        v_location;

    if v_role in ('SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN') then
        return true;
    end if;

    select
        f.user_id,
        f.farmer_leader_id,
        f.state_id,
        f.district_id,
        f.block_id,
        f.panchayat_id
    into
        v_farmer_user,
        v_farmer_leader,
        v_state,
        v_district,
        v_block,
        v_panchayat
    from public.farmers f
    where f.id = p_farmer_id;

    if not found then
        return false;
    end if;

    if v_role = 'FARMER' then
        return v_farmer_user = v_user;
    end if;

    if v_role = 'STATE_MANAGER' then
        return v_location is not null and v_state = v_location;
    end if;

    if v_role = 'DISTRICT_MANAGER' then
        return v_location is not null and v_district = v_location;
    end if;

    if v_role = 'BLOCK_MANAGER' then
        return v_location is not null and v_block = v_location;
    end if;

    if v_role = 'CLUSTER_SUPERVISOR' then
        if v_location is null then
            return false;
        end if;

        select l.location_type
        into v_location_type
        from public.locations l
        where l.id = v_location
          and l.is_active = true;

        if v_location_type = 'PANCHAYAT' then
            return v_panchayat = v_location;
        elsif v_location_type = 'BLOCK' then
            return v_block = v_location;
        end if;

        return false;
    end if;

    if v_role = 'FARMER_LEADER' then
        select f2.id
        into v_farmer_leader
        from public.farmers f2
        where f2.user_id = v_user
        limit 1;

        return v_farmer_leader is not null
           and v_farmer_leader = (
                select f3.farmer_leader_id
                from public.farmers f3
                where f3.id = p_farmer_id
           );
    end if;

    return false;
end;
$function$;
