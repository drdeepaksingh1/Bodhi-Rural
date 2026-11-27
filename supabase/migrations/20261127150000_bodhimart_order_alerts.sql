create table public.bodhimart_order_alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verified_phone text,
  sms boolean not null default false,
  whatsapp boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.bodhimart_order_alert_preferences enable row level security;
revoke all on public.bodhimart_order_alert_preferences from public, anon, authenticated;

create function public.bodhimart_order_alert_settings(p_sms boolean default null, p_whatsapp boolean default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  viewer uuid := auth.uid();
  phone text;
  settings public.bodhimart_order_alert_preferences%rowtype;
begin
  if viewer is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  select u.phone into phone from auth.users u
    where u.id = viewer and u.phone_confirmed_at is not null and u.phone ~ '^\+?[1-9][0-9]{7,14}$';
  if p_sms is not null and p_whatsapp is not null then
    if (p_sms or p_whatsapp) and phone is null then
      raise exception 'A verified mobile number is required' using errcode = '22023';
    end if;
    insert into public.bodhimart_order_alert_preferences (user_id, verified_phone, sms, whatsapp)
      values (viewer, phone, p_sms, p_whatsapp)
      on conflict (user_id) do update set verified_phone = excluded.verified_phone,
        sms = excluded.sms, whatsapp = excluded.whatsapp, updated_at = statement_timestamp();
  end if;
  select * into settings from public.bodhimart_order_alert_preferences where user_id = viewer;
  return jsonb_build_object('hasPhone', phone is not null,
    'sms', coalesce(settings.verified_phone = phone and settings.sms, false),
    'whatsapp', coalesce(settings.verified_phone = phone and settings.whatsapp, false));
end;
$$;
revoke all on function public.bodhimart_order_alert_settings(boolean, boolean) from public, anon, authenticated;
grant execute on function public.bodhimart_order_alert_settings(boolean, boolean) to authenticated;

create table public.bodhimart_order_alert_outbox (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('buyer', 'seller')),
  channel text not null check (channel in ('sms', 'whatsapp', 'email')),
  reference text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'accepted', 'skipped', 'failed', 'review')),
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  unique(order_id, user_id, audience, channel, reference)
);
create index bodhimart_order_alert_pending_idx on public.bodhimart_order_alert_outbox (next_attempt_at, id)
  where status = 'pending';
alter table public.bodhimart_order_alert_outbox enable row level security;
revoke all on public.bodhimart_order_alert_outbox from public, anon, authenticated;
grant select, update on public.bodhimart_order_alert_outbox to service_role;

create function public.bodhimart_enqueue_order_alerts()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  insert into public.bodhimart_order_alert_outbox (order_id, user_id, audience, channel, reference)
  select o.id, party.user_id, party.audience, channel.name, party.reference
  from public.marketplace_orders o
  join public.marketplace_sellers s on s.id = new.seller_id
  cross join lateral (values
    (o.customer_user_id, 'buyer', o.order_number),
    (s.user_id, 'seller', new.seller_order_number::text)
  ) party(user_id, audience, reference)
  cross join (values ('sms'), ('whatsapp'), ('email')) channel(name)
  where o.id = new.order_id and party.user_id is not null and party.reference is not null
  on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.bodhimart_enqueue_order_alerts() from public, anon, authenticated;
create trigger bodhimart_enqueue_order_alerts after insert on public.marketplace_seller_orders
for each row execute function public.bodhimart_enqueue_order_alerts();

create function public.bodhimart_claim_order_alerts(p_channels text[])
returns table(id bigint, audience text, channel text, reference text, destination text, attempts integer)
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  update public.bodhimart_order_alert_outbox q set status = 'review'
    where q.status = 'sending' and q.claimed_at < statement_timestamp() - interval '5 minutes';

  return query
  with candidates as (
    select q.id from public.bodhimart_order_alert_outbox q
    where q.status = 'pending' and q.channel = any(p_channels)
      and q.next_attempt_at <= statement_timestamp()
    order by q.next_attempt_at, q.id limit 30 for update skip locked
  ), claimed as (
    update public.bodhimart_order_alert_outbox q
      set status = 'sending', attempts = q.attempts + 1, claimed_at = statement_timestamp()
      from candidates c where q.id = c.id
      returning q.*
  )
  select q.id, q.audience, q.channel, q.reference,
    case
      when q.created_at < statement_timestamp() - interval '24 hours' then null
      when o.order_status in ('CANCELLED', 'REFUNDED', 'RETURNED') then null
      when q.channel = 'email' and u.email_confirmed_at is not null then u.email::text
      when q.channel in ('sms', 'whatsapp') and u.phone_confirmed_at is not null
        and pref.verified_phone = u.phone
        and ((q.channel = 'sms' and pref.sms) or (q.channel = 'whatsapp' and pref.whatsapp))
        then '+' || ltrim(u.phone, '+')
      else null
    end,
    q.attempts
  from claimed q join auth.users u on u.id = q.user_id
  join public.marketplace_orders o on o.id = q.order_id
  left join public.bodhimart_order_alert_preferences pref on pref.user_id = u.id;
end;
$$;
revoke all on function public.bodhimart_claim_order_alerts(text[]) from public, anon, authenticated;
grant execute on function public.bodhimart_claim_order_alerts(text[]) to service_role;
