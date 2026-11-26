insert into public.marketplace_categories (slug, name)
values
  ('hotels-restaurants', 'Hotels & Restaurants'),
  ('school-stationery', 'School & Stationery'),
  ('groceries', 'Groceries'),
  ('fresh-produce', 'Fresh Produce'),
  ('clothing-footwear', 'Clothing & Footwear'),
  ('household-personal-care', 'Household & Personal Care'),
  ('hardware-electrical', 'Hardware & Electrical'),
  ('made-locally', 'Made Locally'),
  ('seeds', 'Seeds'),
  ('feed', 'Feed'),
  ('poultry', 'Poultry'),
  ('equipment', 'Equipment')
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name)
select p.id, child.slug, child.name
from (values
  ('hotels-restaurants', 'vegetarian-meals', 'Vegetarian Meals'),
  ('hotels-restaurants', 'non-vegetarian-meals', 'Non-Vegetarian Meals'),
  ('hotels-restaurants', 'restaurant-snacks', 'Snacks'),
  ('hotels-restaurants', 'restaurant-beverages', 'Beverages'),
  ('hotels-restaurants', 'restaurant-desserts', 'Desserts'),
  ('school-stationery', 'school-notebooks', 'Notebooks & Paper'),
  ('school-stationery', 'school-writing', 'Pens & Pencils'),
  ('school-stationery', 'school-art', 'Art & Craft Supplies'),
  ('school-stationery', 'school-bags', 'School Bags'),
  ('school-stationery', 'school-uniforms', 'School Uniforms'),
  ('groceries', 'grocery-grains', 'Grains & Pulses'),
  ('groceries', 'grocery-dairy', 'Dairy'),
  ('groceries', 'grocery-spices', 'Spices'),
  ('groceries', 'grocery-oils', 'Cooking Oils'),
  ('fresh-produce', 'fresh-vegetables', 'Vegetables'),
  ('fresh-produce', 'fresh-fruit', 'Fruit'),
  ('fresh-produce', 'leafy-greens', 'Leafy Greens'),
  ('clothing-footwear', 'clothing-everyday', 'Everyday Clothing'),
  ('clothing-footwear', 'clothing-footwear-items', 'Shoes & Sandals'),
  ('household-personal-care', 'household-cleaning', 'Cleaning Supplies'),
  ('household-personal-care', 'household-kitchen', 'Kitchenware'),
  ('household-personal-care', 'personal-care', 'Personal Care'),
  ('hardware-electrical', 'hardware-tools', 'Hardware Tools'),
  ('hardware-electrical', 'hardware-lighting', 'Lighting & Electrical'),
  ('hardware-electrical', 'hardware-plumbing', 'Plumbing'),
  ('made-locally', 'local-food', 'Local Food Products'),
  ('made-locally', 'local-crafts', 'Local Crafts'),
  ('seeds', 'crop-seeds', 'Crop Seeds'),
  ('seeds', 'vegetable-seeds', 'Vegetable Seeds'),
  ('feed', 'poultry-feed', 'Poultry Feed'),
  ('feed', 'livestock-feed', 'Livestock Feed'),
  ('poultry', 'poultry-chicks', 'Chicks'),
  ('poultry', 'poultry-supplies', 'Poultry Supplies'),
  ('equipment', 'farm-tools', 'Farm Tools'),
  ('equipment', 'farm-equipment', 'Farm Equipment')
) as child(parent_slug, slug, name)
join public.marketplace_categories p on p.slug = child.parent_slug
on conflict (slug) do nothing;
