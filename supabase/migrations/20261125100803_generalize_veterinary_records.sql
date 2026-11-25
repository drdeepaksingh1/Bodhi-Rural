alter table public.veterinary_records
  add column if not exists animal_type text,
  add column if not exists affected_quantity integer;

comment on column public.veterinary_records.animal_type is
  'Species or enterprise type for this health record, including livestock, birds, fish, and other farm animals.';

comment on column public.veterinary_records.affected_quantity is
  'Number of animals or birds affected by the health event; batch-linked poultry mortality continues to use mortality_quantity.';
