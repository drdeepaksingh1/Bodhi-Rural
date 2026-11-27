create function public.bodhimart_delivery_dispatch_options()
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not public.is_bodhi_super_admin() then
    raise exception 'Only an active super administrator can manage deliveries.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'orders', coalesce((
      select jsonb_agg(to_jsonb(o) order by o.created_at desc, o.id)
      from (
        select o.id, o.order_number, o.order_status, o.created_at, a.partner_id
        from public.marketplace_orders o
        left join public.bodhimart_delivery_assignments a on a.order_id = o.id
        where o.delivery_method in ('STANDARD','EXPRESS')
          and o.order_status in ('CONFIRMED','PROCESSING','PACKED','READY_FOR_DISPATCH')
        order by o.created_at desc, o.id
        limit 100
      ) o
    ), '[]'::jsonb),
    'partners', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', coalesce(nullif(p.full_name, ''), p.id::text))
        order by p.full_name, p.id)
      from public.profiles p
      join public.roles r on r.id = p.role_id
      where p.is_active and r.code = 'DELIVERY'
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.bodhimart_delivery_dispatch_options() from public, anon, authenticated;
grant execute on function public.bodhimart_delivery_dispatch_options() to authenticated;
