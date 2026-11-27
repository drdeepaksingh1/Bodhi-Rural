alter table public.marketplace_seller_applications
  add column application_terms_version text,
  add column application_terms_accepted_at timestamptz;

alter table public.bodhimart_delivery_partner_applications
  add column application_terms_version text,
  add column application_terms_accepted_at timestamptz;

create function public.bodhimart_record_application_agreement()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.application_terms_version is distinct from '2026-11-27-v1' then
    raise exception 'Accept the current application terms before submitting.' using errcode = '23514';
  end if;
  new.application_terms_accepted_at := statement_timestamp();
  return new;
end;
$$;

create trigger record_application_agreement
before insert on public.marketplace_seller_applications
for each row execute function public.bodhimart_record_application_agreement();

create trigger record_application_agreement
before insert on public.bodhimart_delivery_partner_applications
for each row execute function public.bodhimart_record_application_agreement();

grant insert (application_terms_version) on public.marketplace_seller_applications to authenticated;
grant insert (application_terms_version) on public.bodhimart_delivery_partner_applications to authenticated;
