create function public.bodhi_review_verified_address(
  p_application_role text,
  p_verified_at timestamptz default null
)
returns table (
  legal_name text,
  document_address text,
  verified_at timestamptz,
  permanent_address_confirmed_at timestamptz
)
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Sign in required.' using errcode = '42501';
  end if;

  if p_verified_at is not null then
    return query
      update bodhi_identity.document_verifications as verification
      set permanent_address_confirmed_at = coalesce(verification.permanent_address_confirmed_at, statement_timestamp())
      where verification.user_id = v_user_id
        and verification.application_role = p_application_role
        and verification.verified_at = p_verified_at
      returning verification.legal_name, verification.document_address,
        verification.verified_at, verification.permanent_address_confirmed_at;
    return;
  end if;

  return query
    select verification.legal_name, verification.document_address,
      verification.verified_at, verification.permanent_address_confirmed_at
    from bodhi_identity.document_verifications verification
    where verification.user_id = v_user_id
      and verification.application_role = p_application_role;
end;
$$;

revoke all on function public.bodhi_review_verified_address(text, timestamptz) from public, anon, authenticated;
grant execute on function public.bodhi_review_verified_address(text, timestamptz) to authenticated;
