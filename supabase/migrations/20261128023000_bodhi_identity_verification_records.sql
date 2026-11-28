-- Store only the values approved for application prefill. The provider backend is
-- responsible for verifying the response before writing a record.
create schema if not exists bodhi_identity;
revoke all on schema bodhi_identity from public, anon, authenticated;

create table bodhi_identity.document_verifications (
  user_id uuid not null references auth.users(id) on delete cascade,
  application_role text not null check (application_role in ('farmer', 'staff', 'delivery')),
  provider text not null check (provider = 'digilocker'),
  legal_name text not null check (length(btrim(legal_name)) between 1 and 250),
  document_address text not null check (length(btrim(document_address)) between 1 and 2000),
  consent_notice_version text not null check (length(btrim(consent_notice_version)) between 1 and 100),
  consented_at timestamptz not null,
  verified_at timestamptz not null check (verified_at >= consented_at),
  permanent_address_confirmed_at timestamptz
    check (permanent_address_confirmed_at >= verified_at),
  primary key (user_id, application_role)
);

alter table bodhi_identity.document_verifications enable row level security;
revoke all on bodhi_identity.document_verifications from public, anon, authenticated;
grant usage on schema bodhi_identity to service_role;
grant select, insert, update, delete on bodhi_identity.document_verifications to service_role;
