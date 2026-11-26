update public.marketplace_categories
set name = case slug when 'seeds' then 'Seeds & Crop Care'
                     when 'poultry' then 'Livestock & Poultry' end
where slug in ('seeds','poultry');

-- Retain the existing category IDs so their listings move with them.
update public.marketplace_categories c
set parent_id = p.id
from (values ('agriculture','seeds'), ('farm-inputs','seeds'),
             ('birds','poultry'), ('goat','poultry'), ('veterinary','poultry')
) as moves(child_slug,parent_slug)
join public.marketplace_categories p on p.slug = moves.parent_slug
where c.slug = moves.child_slug and c.parent_id is null;

insert into public.marketplace_categories (parent_id, slug, name)
select p.id, child.slug, child.name
from (values
  ('seeds','fertilisers','Fertilisers & Soil Nutrition'),
  ('seeds','crop-protection','Crop Protection'),
  ('seeds','soil-testing','Soil Testing'),
  ('poultry','veterinary-medicines','Veterinary Medicines'),
  ('poultry','animal-health-supplies','Animal Health Supplies'),
  ('poultry','livestock-care','Livestock Care & Accessories'),
  ('feed','feed-supplements','Feed Supplements'),
  ('equipment','irrigation-equipment','Irrigation Equipment'),
  ('groceries','grocery-beverages','Tea & Beverages'),
  ('fresh-produce','fresh-herbs','Fresh Herbs'),
  ('clothing-footwear','clothing-accessories','Clothing Accessories'),
  ('household-personal-care','home-storage','Home Storage'),
  ('hardware-electrical','hardware-fasteners','Fasteners & Fittings'),
  ('made-locally','shg-products','Self-Help Group Products')
) as child(parent_slug,slug,name)
join public.marketplace_categories p on p.slug = child.parent_slug
on conflict (slug) do nothing;
