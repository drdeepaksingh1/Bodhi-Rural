-- Reject unknown staff-application decisions and require a reason for rejection.
-- Preserve the existing authorization, locking, stage transitions and staff creation logic.
DO $migration$
DECLARE
    v_definition text;
    v_old text := E'BEGIN\n\n    v_user := auth.uid();';
    v_new text := E'BEGIN\n\n    IF upper(COALESCE(trim(p_decision), '''')) NOT IN (''APPROVED'', ''REJECTED'') THEN\n        RAISE EXCEPTION ''Decision must be APPROVED or REJECTED'';\n    END IF;\n\n    IF upper(trim(p_decision)) = ''REJECTED''\n       AND NULLIF(trim(p_remarks), '''') IS NULL THEN\n        RAISE EXCEPTION ''A rejection reason is required'';\n    END IF;\n\n    v_user := auth.uid();';
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
