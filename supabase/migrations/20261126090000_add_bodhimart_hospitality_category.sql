insert into public.marketplace_categories (name, slug, description)
select 'Hotels & Restaurants', 'hotels-restaurants',
       'Prepared meals, snacks and beverages from local hotels and restaurants.'
where not exists (
  select 1 from public.marketplace_categories
  where slug = 'hotels-restaurants' or lower(name) = 'hotels & restaurants'
);
