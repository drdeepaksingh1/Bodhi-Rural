-- Route egg procurement writes through authenticated, role-checked RPCs.
-- Direct table mutations are revoked so farmers cannot self-approve procurement.

CREATE OR REPLACE FUNCTION public.submit_egg_procurement(
    p_farmer_id uuid,
    p_batch_id uuid,
    p_collection_date date,
    p_saleable_eggs integer,
    p_rate_per_egg numeric,
    p_quality_deduction numeric DEFAULT 0,
    p_other_deduction numeric DEFAULT 0,
    p_remarks text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_procurement_id uuid;
    v_gross numeric;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT (
        public.can_access_bodhi_finance()
        OR public.farmer_in_user_scope(p_farmer_id)
    ) THEN
        RAISE EXCEPTION 'Not authorized to submit procurement for this farmer';
    END IF;

    IF p_farmer_id IS NULL OR p_saleable_eggs IS NULL OR p_saleable_eggs < 1 THEN
        RAISE EXCEPTION 'Farmer and a positive saleable egg quantity are required';
    END IF;

    IF p_rate_per_egg IS NULL OR p_rate_per_egg < 0 THEN
        RAISE EXCEPTION 'Rate per egg must be zero or greater';
    END IF;

    IF COALESCE(p_quality_deduction, 0) < 0
       OR COALESCE(p_other_deduction, 0) < 0 THEN
        RAISE EXCEPTION 'Deductions cannot be negative';
    END IF;

    v_gross := p_saleable_eggs::numeric * p_rate_per_egg;
    IF COALESCE(p_quality_deduction, 0) + COALESCE(p_other_deduction, 0) > v_gross THEN
        RAISE EXCEPTION 'Deductions cannot exceed gross procurement amount';
    END IF;

    PERFORM 1
    FROM public.farmers
    WHERE id = p_farmer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Farmer not found';
    END IF;

    IF p_batch_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM public.bird_batches
        WHERE id = p_batch_id
          AND farmer_id = p_farmer_id
    ) THEN
        RAISE EXCEPTION 'Selected batch does not belong to this farmer';
    END IF;

    INSERT INTO public.egg_procurement (
        farmer_id, batch_id, collection_date, saleable_eggs,
        rate_per_egg, quality_deduction, other_deduction,
        remarks, status, created_by
    )
    VALUES (
        p_farmer_id, p_batch_id, COALESCE(p_collection_date, CURRENT_DATE),
        p_saleable_eggs, p_rate_per_egg,
        COALESCE(p_quality_deduction, 0),
        COALESCE(p_other_deduction, 0),
        NULLIF(pg_catalog.btrim(p_remarks), ''),
        'PENDING', v_user_id
    )
    RETURNING id INTO v_procurement_id;

    RETURN v_procurement_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_egg_procurement(p_procurement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_status text;
BEGIN
    IF v_user_id IS NULL OR NOT public.can_access_bodhi_finance() THEN
        RAISE EXCEPTION 'Finance authorization required';
    END IF;

    IF p_procurement_id IS NULL THEN
        RAISE EXCEPTION 'Procurement ID is required';
    END IF;

    SELECT status
    INTO v_status
    FROM public.egg_procurement
    WHERE id = p_procurement_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Procurement record not found';
    END IF;

    IF v_status <> 'PENDING' THEN
        RAISE EXCEPTION 'Only pending procurement can be approved';
    END IF;

    UPDATE public.egg_procurement
    SET status = 'APPROVED',
        approved_by = v_user_id,
        approved_at = pg_catalog.now(),
        updated_at = pg_catalog.now()
    WHERE id = p_procurement_id;

    RETURN p_procurement_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_egg_procurement(uuid, uuid, date, integer, numeric, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_egg_procurement(uuid, uuid, date, integer, numeric, numeric, numeric, text) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_egg_procurement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_egg_procurement(uuid) TO authenticated;

REVOKE ALL ON TABLE public.egg_procurement FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.egg_procurement FROM authenticated;
GRANT SELECT ON TABLE public.egg_procurement TO authenticated;

DROP POLICY IF EXISTS "RBAC can insert egg procurement" ON public.egg_procurement;
DROP POLICY IF EXISTS "RBAC can update egg procurement" ON public.egg_procurement;
