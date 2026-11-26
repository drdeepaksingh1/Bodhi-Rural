CREATE OR REPLACE FUNCTION public.bodhi_adjust_seller_listing_stock(p_marketplace_product_id uuid, p_new_quantity numeric, p_adjustment_reason text, p_remarks text DEFAULT NULL::text, p_evidence_url text DEFAULT NULL::text)
 RETURNS TABLE(adjustment_id uuid, movement_id uuid, previous_quantity numeric, adjusted_quantity numeric, adjustment_difference numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_seller_id UUID;
    v_inventory_id UUID;
    v_previous_quantity NUMERIC;
    v_reserved_quantity NUMERIC;
    v_operation_key UUID;
    v_adjustment_id UUID;
    v_adjustment_number TEXT;
    v_movement_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    IF p_marketplace_product_id IS NULL THEN
        RAISE EXCEPTION 'Marketplace product ID is required.';
    END IF;

    IF p_new_quantity IS NULL OR p_new_quantity < 0 THEN
        RAISE EXCEPTION 'Stock quantity cannot be negative.';
    END IF;

    IF p_new_quantity <> trunc(p_new_quantity) THEN
        RAISE EXCEPTION 'Stock quantity must be a whole number.';
    END IF;

    IF NULLIF(trim(p_adjustment_reason), '') IS NULL THEN
        RAISE EXCEPTION 'Adjustment reason is mandatory.';
    END IF;

    IF length(trim(p_adjustment_reason)) > 250 THEN
        RAISE EXCEPTION 'Adjustment reason must not exceed 250 characters.';
    END IF;

    IF p_remarks IS NOT NULL AND length(p_remarks) > 1000 THEN
        RAISE EXCEPTION 'Remarks must not exceed 1000 characters.';
    END IF;

    IF p_evidence_url IS NOT NULL AND length(p_evidence_url) > 2048 THEN
        RAISE EXCEPTION 'Evidence URL is too long.';
    END IF;

    -- Verify active seller ownership.
    SELECT s.id
    INTO v_seller_id
    FROM public.marketplace_sellers s
    JOIN public.marketplace_products p
      ON p.seller_id = s.id
    WHERE p.id = p_marketplace_product_id
      AND s.user_id = v_user_id
      AND s.status = 'ACTIVE'
      AND p.status IN ('ACTIVE', 'PENDING')
    FOR UPDATE OF s, p;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock can only be adjusted by the active seller for their own active or pending listing.';
    END IF;

    -- Lock the inventory row.
    SELECT
        i.id,
        i.stock_quantity,
        i.reserved_quantity
    INTO
        v_inventory_id,
        v_previous_quantity,
        v_reserved_quantity
    FROM public.marketplace_inventory i
    WHERE i.product_id = p_marketplace_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory record not found.';
    END IF;

    IF p_new_quantity < v_reserved_quantity THEN
        RAISE EXCEPTION
            'New stock cannot be lower than reserved stock. Reserved quantity: %',
            v_reserved_quantity;
    END IF;

    IF p_new_quantity = v_previous_quantity THEN
        RAISE EXCEPTION 'New stock quantity is identical to current stock.';
    END IF;

    v_operation_key := gen_random_uuid();

    v_adjustment_number :=
        'SADJ-' ||
        to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') ||
        '-' ||
        upper(substr(replace(v_operation_key::text, '-', ''), 1, 6));

    -- Insert audit record.
    INSERT INTO public.bodhi_stock_adjustment_audit (
        adjustment_number,
        operation_key,
        adjustment_type,
        seller_id,
        marketplace_product_id,
        previous_quantity,
        adjusted_quantity,
        adjustment_reason,
        remarks,
        evidence_url,
        status,
        requested_by,
        posted_at
    )
    VALUES (
        v_adjustment_number,
        v_operation_key,
        'SELLER_LISTING',
        v_seller_id,
        p_marketplace_product_id,
        v_previous_quantity,
        p_new_quantity,
        trim(p_adjustment_reason),
        NULLIF(trim(p_remarks), ''),
        NULLIF(trim(p_evidence_url), ''),
        'POSTED',
        v_user_id,
        now()
    )
    RETURNING id INTO v_adjustment_id;

    -- Update current seller listing stock.
    UPDATE public.marketplace_inventory
    SET
        stock_quantity = p_new_quantity,
        updated_at = now()
    WHERE id = v_inventory_id;

    -- Insert stock movement.
    INSERT INTO public.bodhi_marketplace_stock_movements (
        marketplace_product_id,
        seller_id,
        movement_type,
        previous_quantity,
        change_quantity,
        new_quantity,
        reference_type,
        reference_id,
        reason,
        remarks,
        performed_by
    )
    VALUES (
        p_marketplace_product_id,
        v_seller_id,
        CASE
            WHEN p_new_quantity > v_previous_quantity
                THEN 'STOCK_ADDITION'
            ELSE 'SELLER_ADJUSTMENT'
        END,
        v_previous_quantity,
        p_new_quantity - v_previous_quantity,
        p_new_quantity,
        'STOCK_ADJUSTMENT_AUDIT',
        v_adjustment_id,
        trim(p_adjustment_reason),
        NULLIF(trim(p_remarks), ''),
        v_user_id
    )
    RETURNING id INTO v_movement_id;

    RETURN QUERY
    SELECT
        v_adjustment_id,
        v_movement_id,
        v_previous_quantity,
        p_new_quantity,
        p_new_quantity - v_previous_quantity;
END;
$function$;
