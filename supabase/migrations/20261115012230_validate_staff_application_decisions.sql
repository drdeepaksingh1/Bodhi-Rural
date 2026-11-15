-- Reject unknown staff-application decisions and require a reason for rejection.
-- Preserve the existing authorization, locking, stage transitions and staff creation logic.
DO $migration$
DECLARE
    v_definition text;
    v_old text := 'v_user := auth.uid();';
    v_new text := $replacement$
IF upper(COALESCE(trim(p_decision), '')) NOT IN ('APPROVED', 'REJECTED') THEN
        RAISE EXCEPTION 'Decision must be APPROVED or REJECTED';
    END IF;

    IF upper(trim(p_decision)) = 'REJECTED'
       AND NULLIF(trim(p_remarks), '') IS NULL THEN
        RAISE EXCEPTION 'A rejection reason is required';
    END IF;

    v_user := auth.uid();
$replacement$;
BEGIN
    v_definition := pg_get_functiondef(
        'public.process_staff_application(uuid,text,text)'::regprocedure
    );

    IF position(v_old IN v_definition) = 0 THEN
        RAISE EXCEPTION 'Expected process_staff_application definition was not found; aborting safely';
    END IF;

    v_definition := replace(v_definition, v_old, v_new);
    EXECUTE v_definition;
END
$migration$;
