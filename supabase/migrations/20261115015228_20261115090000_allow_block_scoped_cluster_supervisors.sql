CREATE OR REPLACE FUNCTION public.update_managed_user_role(
  p_user_id uuid,
  p_role_id uuid,
  p_location_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_actor_role text;
  v_target_role text;
  v_new_role text;
  v_location_type text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_actor_role := public.current_user_role_code();
  IF v_actor_role NOT IN ('SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN') THEN
    RAISE EXCEPTION 'Not authorized to manage user roles';
  END IF;

  IF p_user_id IS NULL OR p_role_id IS NULL OR p_is_active IS NULL THEN
    RAISE EXCEPTION 'User, role and active status are required';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own role or active status here';
  END IF;

  SELECT r.code INTO v_target_role
  FROM public.profiles p
  LEFT JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = p_user_id
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT code INTO v_new_role
  FROM public.roles
  WHERE id = p_role_id;

  IF v_new_role IS NULL THEN
    RAISE EXCEPTION 'Selected role does not exist';
  END IF;

  IF v_actor_role <> 'SUPER_ADMIN'
     AND (v_target_role IN ('SUPER_ADMIN', 'CEO') OR v_new_role IN ('SUPER_ADMIN', 'CEO')) THEN
    RAISE EXCEPTION 'Only SUPER_ADMIN can manage SUPER_ADMIN or CEO assignments';
  END IF;

  IF v_new_role = 'STATE_MANAGER' THEN
    SELECT location_type INTO v_location_type
    FROM public.locations
    WHERE id = p_location_id AND is_active = true;
    IF v_location_type IS DISTINCT FROM 'STATE' THEN
      RAISE EXCEPTION 'A State Manager must be assigned to an active STATE location';
    END IF;
  ELSIF v_new_role = 'DISTRICT_MANAGER' THEN
    SELECT location_type INTO v_location_type
    FROM public.locations
    WHERE id = p_location_id AND is_active = true;
    IF v_location_type IS DISTINCT FROM 'DISTRICT' THEN
      RAISE EXCEPTION 'A District Manager must be assigned to an active DISTRICT location';
    END IF;
  ELSIF v_new_role IN ('BLOCK_MANAGER', 'CLUSTER_SUPERVISOR') THEN
    SELECT location_type INTO v_location_type
    FROM public.locations
    WHERE id = p_location_id AND is_active = true;
    IF v_location_type IS DISTINCT FROM 'BLOCK' THEN
      RAISE EXCEPTION 'A Block Manager or Cluster Supervisor must be assigned to an active BLOCK location';
    END IF;
  ELSE
    IF p_location_id IS NOT NULL THEN
      RAISE EXCEPTION 'This role must not have a geographic assignment';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role_id = p_role_id,
      location_id = p_location_id,
      is_active = p_is_active,
      updated_at = now()
  WHERE id = p_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_managed_user_role(uuid, uuid, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_managed_user_role(uuid, uuid, uuid, boolean) TO authenticated;