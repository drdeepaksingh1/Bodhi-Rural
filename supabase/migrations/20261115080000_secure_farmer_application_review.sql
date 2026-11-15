-- Enforce reviewer geography, protect workflow fields, and keep applicant documents private.
alter table public.farmer_applications enable row level security;

create or replace function public.can_review_farmer_application(
  p_application_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from public.farmer_applications fa
    join public.profiles p
      on p.id = auth.uid()
     and p.is_active = true
    join public.roles r
      on r.id = p.role_id
    left join public.locations assigned_location
      on assigned_location.id = p.location_id
     and assigned_location.is_active = true
    where fa.id = p_application_id
      and (
        r.code in ('SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN')
        or (
          r.code = 'STATE_MANAGER'
          and assigned_location.location_type = 'STATE'
          and fa.state_id = assigned_location.id
        )
        or (
          r.code = 'DISTRICT_MANAGER'
          and assigned_location.location_type = 'DISTRICT'
          and fa.district_id = assigned_location.id
        )
        or (
          r.code = 'BLOCK_MANAGER'
          and assigned_location.location_type = 'BLOCK'
          and fa.block_id = assigned_location.id
        )
        -- Cluster supervisors are assigned to a panchayat or block in the
        -- current location model; unknown/unmapped assignments fail closed.
        or (
          r.code = 'CLUSTER_SUPERVISOR'
          and (
            (assigned_location.location_type = 'PANCHAYAT'
              and fa.panchayat_id = assigned_location.id)
            or
            (assigned_location.location_type = 'BLOCK'
              and fa.block_id = assigned_location.id)
          )
        )
      )
  );
$function$;

revoke all on function public.can_review_farmer_application(uuid) from public;
revoke all on function public.can_review_farmer_application(uuid) from anon;
grant execute on function public.can_review_farmer_application(uuid) to authenticated;

drop policy if exists "Management can view farmer applications"
  on public.farmer_applications;
drop policy if exists "Management can review farmer applications"
  on public.farmer_applications;

create policy "Scoped management can view farmer applications"
  on public.farmer_applications
  for select
  to authenticated
  using (public.can_review_farmer_application(id));

-- All reviewer writes go through the scope-checked RPC below. The applicant's
-- existing INSERT and own-row SELECT policies remain in place.
revoke update on table public.farmer_applications from authenticated;

create or replace function public.review_farmer_application(
  p_application_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_status text;
  v_reason text := nullif(btrim(p_rejection_reason), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if p_application_id is null then
    raise exception 'Application ID is required.';
  end if;

  if p_decision is null or p_decision not in ('APPROVE', 'REJECT') then
    raise exception 'Decision must be APPROVE or REJECT.';
  end if;

  if p_decision = 'REJECT' and v_reason is null then
    raise exception 'A rejection reason is required.';
  end if;

  if p_decision = 'REJECT' and char_length(v_reason) > 1000 then
    raise exception 'Rejection reason must be 1000 characters or fewer.';
  end if;

  select fa.status
    into v_status
  from public.farmer_applications fa
  where fa.id = p_application_id
  for update;

  if not found then
    raise exception 'Farmer application was not found.';
  end if;

  if not public.can_review_farmer_application(p_application_id) then
    raise exception 'You are not authorized to review this application in your assigned area.';
  end if;

  if v_status <> 'PENDING' then
    raise exception 'Only PENDING applications can be reviewed.';
  end if;

  update public.farmer_applications
  set status = case when p_decision = 'APPROVE' then 'APPROVED' else 'REJECTED' end,
      rejection_reason = case when p_decision = 'REJECT' then v_reason else null end,
      updated_at = now()
  where id = p_application_id
    and status = 'PENDING';

  if not found then
    raise exception 'Application status changed before the review could be saved.';
  end if;
end;
$function$;

revoke all on function public.review_farmer_application(uuid, text, text) from public;
revoke all on function public.review_farmer_application(uuid, text, text) from anon;
grant execute on function public.review_farmer_application(uuid, text, text) to authenticated;

-- Allow reviewers to read only the private document objects belonging to an
-- application that the same reviewer is currently authorized to review.
drop policy if exists "Farmer application reviewers can view documents"
  on storage.objects;

create policy "Farmer application reviewers can view documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('farmer-photos', 'farmer-aadhaar', 'farmer-bank-documents')
    and exists (
      select 1
      from public.farmer_applications fa
      where fa.user_id::text = (storage.foldername(name))[1]
        and public.can_review_farmer_application(fa.id)
    )
  );

-- Apply storage-side size and MIME restrictions as well as server-side
-- content-signature validation in the registration upload action.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'farmer-photos';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
where id in ('farmer-aadhaar', 'farmer-bank-documents');
