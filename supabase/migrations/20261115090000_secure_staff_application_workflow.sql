-- Staff applications are submitted once and then managed only by the
-- authenticated HR -> CEO -> SUPER_ADMIN workflow RPC.
alter table public.staff_applications enable row level security;
alter table public.staff_application_approvals enable row level security;

-- Anonymous users have no staff application or approval-history workflow.
revoke all privileges on table public.staff_applications from anon;
revoke all privileges on table public.staff_application_approvals from anon;

-- Applicants may create an application and read their own row. Reviewers may
-- read through the existing management RLS policy. No authenticated user may
-- directly update or delete an application.
revoke all privileges on table public.staff_applications from authenticated;
grant select, insert on table public.staff_applications to authenticated;

drop policy if exists "Staff applicants can update own application"
  on public.staff_applications;

-- Approval history is read-only to authorized reviewers. All inserts are made
-- by process_staff_application under its SECURITY DEFINER owner context.
revoke all privileges on table public.staff_application_approvals from authenticated;
grant select on table public.staff_application_approvals to authenticated;

-- Do not let an applicant submit a forged workflow state, approval metadata,
-- staff linkage, or rejection reason on initial INSERT.
create or replace function public.enforce_staff_application_submission_fields()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to submit a staff application.';
  end if;

  if new.user_id is distinct from auth.uid() then
    raise exception 'A staff application must belong to the authenticated applicant.';
  end if;

  new.application_number := null;
  new.status := 'SUBMITTED';
  new.current_stage := 'HR';
  new.rejection_reason := null;
  new.submitted_at := now();
  new.approved_at := null;
  new.approved_by := null;
  new.staff_id := null;
  new.updated_at := now();

  return new;
end;
$function$;

revoke all on function public.enforce_staff_application_submission_fields() from public;
revoke all on function public.enforce_staff_application_submission_fields() from anon;
revoke all on function public.enforce_staff_application_submission_fields() from authenticated;

drop trigger if exists trg_enforce_staff_application_submission_fields
  on public.staff_applications;

create trigger trg_enforce_staff_application_submission_fields
before insert on public.staff_applications
for each row
execute function public.enforce_staff_application_submission_fields();

CREATE OR REPLACE FUNCTION public.process_staff_application(p_application_id uuid, p_decision text, p_remarks text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_role text;
    v_user uuid;
    v_application public.staff_applications%ROWTYPE;
    v_role_id uuid;
    v_staff_uuid uuid;
    v_new_status text;
    v_next_stage text;
    v_staff_id text;
    v_decision text;
BEGIN

    v_user := auth.uid();

    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_role := public.current_user_role_code();
    v_decision := upper(btrim(p_decision));

    IF v_decision IS NULL OR v_decision NOT IN ('APPROVED', 'REJECTED') THEN
        RAISE EXCEPTION 'Decision must be APPROVED or REJECTED';
    END IF;

    -- Only HR, CEO and Chairman/MD can approve staff applications
    IF v_role NOT IN (
        'HR',
        'CEO',
        'SUPER_ADMIN'
    ) THEN
        RAISE EXCEPTION
            'You are not authorized to process staff applications';
    END IF;

    -- Load application
    SELECT *
    INTO v_application
    FROM public.staff_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Staff application not found';
    END IF;

    -- -----------------------------------------------------
    -- REJECTION
    -- -----------------------------------------------------

    IF v_decision = 'REJECTED' THEN

        IF NULLIF(btrim(p_remarks), '') IS NULL THEN
            RAISE EXCEPTION 'Rejection remarks are required';
        END IF;

        IF char_length(btrim(p_remarks)) > 1000 THEN
            RAISE EXCEPTION 'Rejection remarks must be 1000 characters or fewer';
        END IF;

        IF v_role = 'HR'
           AND v_application.status IN (
                'SUBMITTED',
                'HR_REVIEW'
           ) THEN

            v_new_status := 'HR_REJECTED';

        ELSIF v_role = 'CEO'
           AND v_application.status IN (
                'CEO_REVIEW'
           ) THEN

            v_new_status := 'CEO_REJECTED';

        ELSIF v_role = 'SUPER_ADMIN'
           AND v_application.status IN (
                'CHAIRMAN_REVIEW'
           ) THEN

            v_new_status := 'REJECTED';

        ELSE
            RAISE EXCEPTION
                'This application is not at the correct stage for your role';
        END IF;

        UPDATE public.staff_applications
        SET
            status = v_new_status,
            rejection_reason = p_remarks,
            updated_at = now()
        WHERE id = p_application_id;

        INSERT INTO public.staff_application_approvals (
            application_id,
            approver_user_id,
            approver_role_id,
            stage,
            decision,
            remarks
        )
        VALUES (
            p_application_id,
            v_user,
            (
                SELECT id
                FROM public.roles
                WHERE code = v_role
                LIMIT 1
            ),
            v_role,
            'REJECTED',
            p_remarks
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', v_new_status,
            'staff_id', null
        );

    END IF;


    -- -----------------------------------------------------
    -- HR APPROVAL
    -- -----------------------------------------------------

    IF v_role = 'HR' THEN

        IF v_application.status NOT IN (
            'SUBMITTED',
            'HR_REVIEW'
        ) THEN
            RAISE EXCEPTION
                'Application is not awaiting HR approval';
        END IF;

        v_new_status := 'CEO_REVIEW';
        v_next_stage := 'CEO';

        UPDATE public.staff_applications
        SET
            status = v_new_status,
            current_stage = v_next_stage,
            updated_at = now()
        WHERE id = p_application_id;

        INSERT INTO public.staff_application_approvals (
            application_id,
            approver_user_id,
            approver_role_id,
            stage,
            decision,
            remarks
        )
        VALUES (
            p_application_id,
            v_user,
            (
                SELECT id
                FROM public.roles
                WHERE code = 'HR'
                LIMIT 1
            ),
            'HR',
            'APPROVED',
            p_remarks
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', v_new_status,
            'next_stage', v_next_stage
        );

    END IF;


    -- -----------------------------------------------------
    -- CEO APPROVAL
    -- -----------------------------------------------------

    IF v_role = 'CEO' THEN

        IF v_application.status <> 'CEO_REVIEW' THEN
            RAISE EXCEPTION
                'Application is not awaiting CEO approval';
        END IF;

        v_new_status := 'CHAIRMAN_REVIEW';
        v_next_stage := 'CHAIRMAN / MD';

        UPDATE public.staff_applications
        SET
            status = v_new_status,
            current_stage = v_next_stage,
            updated_at = now()
        WHERE id = p_application_id;

        INSERT INTO public.staff_application_approvals (
            application_id,
            approver_user_id,
            approver_role_id,
            stage,
            decision,
            remarks
        )
        VALUES (
            p_application_id,
            v_user,
            (
                SELECT id
                FROM public.roles
                WHERE code = 'CEO'
                LIMIT 1
            ),
            'CEO',
            'APPROVED',
            p_remarks
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', v_new_status,
            'next_stage', v_next_stage
        );

    END IF;


    -- -----------------------------------------------------
    -- CHAIRMAN / MD FINAL APPROVAL
    -- -----------------------------------------------------

    IF v_role = 'SUPER_ADMIN' THEN

        IF v_application.status <> 'CHAIRMAN_REVIEW' THEN
            RAISE EXCEPTION
                'Application is not awaiting Chairman / MD approval';
        END IF;

        -- Prevent duplicate staff creation
        IF v_application.staff_id IS NOT NULL THEN
            RAISE EXCEPTION
                'A Staff record already exists for this application';
        END IF;

        -- Create permanent Staff record.
        -- staff_id is generated automatically by the
        -- existing staff trigger.
        INSERT INTO public.staff (
            user_id,
            full_name,
            email,
            phone,
            designation,
            department,
            role_id,
            joining_date,
            employment_status,
            state_id,
            district_id,
            block_id,
            panchayat_id,
            address
        )
        VALUES (
            v_application.user_id,
            v_application.full_name,
            v_application.email,
            v_application.mobile,
            v_application.proposed_designation,
            v_application.proposed_department,
            v_application.proposed_role_id,
            CURRENT_DATE,
            'ACTIVE',
            v_application.proposed_state_id,
            v_application.proposed_district_id,
            v_application.proposed_block_id,
            v_application.proposed_panchayat_id,
            v_application.address
        )
        RETURNING id, staff_id
        INTO v_staff_uuid, v_staff_id;

        -- Finalize application
        UPDATE public.staff_applications
        SET
            status = 'APPROVED',
            current_stage = NULL,
            approved_at = now(),
            approved_by = v_user,
            staff_id = v_staff_uuid,
            updated_at = now()
        WHERE id = p_application_id;

        -- Record final approval
        INSERT INTO public.staff_application_approvals (
            application_id,
            approver_user_id,
            approver_role_id,
            stage,
            decision,
            remarks
        )
        VALUES (
            p_application_id,
            v_user,
            (
                SELECT id
                FROM public.roles
                WHERE code = 'SUPER_ADMIN'
                LIMIT 1
            ),
            'CHAIRMAN / MD',
            'APPROVED',
            p_remarks
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', 'APPROVED',
            'staff_id', v_staff_id,
            'staff_uuid', v_staff_uuid
        );

    END IF;


    RAISE EXCEPTION 'Unsupported approval action';

END;
$function$


revoke all on function public.process_staff_application(uuid, text, text) from public;
revoke all on function public.process_staff_application(uuid, text, text) from anon;
grant execute on function public.process_staff_application(uuid, text, text) to authenticated;
