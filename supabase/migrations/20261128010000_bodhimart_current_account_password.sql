create function public.bodhimart_current_account_has_password()
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select u.encrypted_password <> ''
    from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
  ), false);
$$;

revoke all on function public.bodhimart_current_account_has_password() from public, anon, authenticated;
grant execute on function public.bodhimart_current_account_has_password() to authenticated;
