REVOKE UPDATE ON TABLE public.staff_applications FROM authenticated;
REVOKE INSERT ON TABLE public.staff_applications FROM authenticated;
GRANT INSERT (
  user_id, mobile, otp_verified_at, full_name, father_husband_name,
  date_of_birth, gender, blood_group, email, alternate_mobile, address,
  state_id, district_id, block_id, panchayat_id, village_id,
  highest_qualification, course, institution, passing_year,
  previous_organization, previous_designation, total_experience_years,
  proposed_department, proposed_designation, proposed_role_id,
  proposed_state_id, proposed_district_id, proposed_block_id,
  proposed_panchayat_id
) ON TABLE public.staff_applications TO authenticated;

DROP POLICY IF EXISTS "Staff applicants can update own application" ON public.staff_applications;

CREATE OR REPLACE FUNCTION public.submit_staff_application(p_application_id uuid)
RETURNS TABLE(application_id uuid, application_number text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  UPDATE public.staff_applications a
  SET status = 'SUBMITTED',
      current_stage = 'HR',
      submitted_at = now(),
      updated_at = now()
  WHERE a.id = p_application_id
    AND a.user_id = auth.uid()
    AND a.status = 'DRAFT'
    AND a.otp_verified_at IS NOT NULL
    AND NULLIF(trim(a.full_name), '') IS NOT NULL
    AND NULLIF(trim(a.mobile), '') IS NOT NULL
    AND NULLIF(trim(a.proposed_designation), '') IS NOT NULL
    AND a.proposed_role_id IS NOT NULL
  RETURNING a.id, a.application_number, a.status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft application not found, already submitted, or required verification/details are missing';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_staff_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_staff_application(uuid) TO authenticated;
