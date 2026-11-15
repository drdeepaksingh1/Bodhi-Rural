-- Email verification must be established by Supabase Auth, never by applicant-supplied data.
REVOKE INSERT (otp_verified_at)
ON TABLE public.staff_applications
FROM authenticated;

CREATE OR REPLACE FUNCTION public.submit_staff_application(p_application_id uuid)
RETURNS TABLE(application_id uuid, application_number text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_auth_email text;
  v_email_confirmed_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT u.email, u.email_confirmed_at
  INTO v_auth_email, v_email_confirmed_at
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_email_confirmed_at IS NULL OR NULLIF(trim(v_auth_email), '') IS NULL THEN
    RAISE EXCEPTION 'A verified Supabase Auth email is required';
  END IF;

  RETURN QUERY
  UPDATE public.staff_applications a
  SET status = 'SUBMITTED',
      current_stage = 'HR',
      otp_verified_at = v_email_confirmed_at,
      submitted_at = now(),
      updated_at = now()
  WHERE a.id = p_application_id
    AND a.user_id = auth.uid()
    AND a.status = 'DRAFT'
    AND lower(trim(a.email)) = lower(trim(v_auth_email))
    AND NULLIF(trim(a.full_name), '') IS NOT NULL
    AND NULLIF(trim(a.mobile), '') IS NOT NULL
    AND NULLIF(trim(a.proposed_designation), '') IS NOT NULL
    AND a.proposed_role_id IS NOT NULL
  RETURNING a.id, a.application_number, a.status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft application not found, already submitted, or verified email/details do not match';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_staff_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_staff_application(uuid) TO authenticated;
