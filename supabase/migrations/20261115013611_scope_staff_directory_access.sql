CREATE OR REPLACE FUNCTION public.get_staff_directory()
RETURNS SETOF public.staff
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role text;
  v_location_id uuid;
BEGIN
  SELECT r.code, p.location_id
    INTO v_role, v_location_id
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
    AND p.is_active = true;

  IF auth.uid() IS NULL OR v_role IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_role NOT IN (
    'SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN',
    'STATE_MANAGER', 'DISTRICT_MANAGER', 'BLOCK_MANAGER',
    'CLUSTER_SUPERVISOR', 'HR', 'MIS'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view the staff directory';
  END IF;

  RETURN QUERY
  SELECT s.*
  FROM public.staff s
  WHERE
    v_role IN ('SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN', 'HR', 'MIS')
    OR (v_role = 'STATE_MANAGER' AND v_location_id IS NOT NULL AND s.state_id = v_location_id)
    OR (v_role = 'DISTRICT_MANAGER' AND v_location_id IS NOT NULL AND s.district_id = v_location_id)
    OR (v_role = 'BLOCK_MANAGER' AND v_location_id IS NOT NULL AND s.block_id = v_location_id)
    OR (
      v_role = 'CLUSTER_SUPERVISOR'
      AND v_location_id IS NOT NULL
      AND (s.panchayat_id = v_location_id OR s.block_id = v_location_id)
    )
  ORDER BY s.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_staff_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_staff_directory() TO authenticated;
