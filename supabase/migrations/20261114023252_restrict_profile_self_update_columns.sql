-- Profiles contain authorization and administrative identity fields.
-- Authenticated users may read their own row and update only basic contact/profile
-- fields. Role, activation, location, employee code, and audit timestamps remain
-- server/admin controlled. Anonymous access is not required.
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.profiles from authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, phone, avatar_url)
  on table public.profiles to authenticated;
