-- Agricultural history records scoped to a farm and its organization.
create unique index if not exists farms_id_organization_id_uidx on public.farms (id, organization_id);
create table if not exists public.agricultural_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null,
  organization_id uuid not null,
  record_type text not null check (record_type in ('planting','harvest','field_observation','pest_disease','fertilizer','treatment','yield','other')),
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text,
  occurred_at date not null default current_date,
  crop text,
  observation_status text check (observation_status is null or observation_status in ('observed','suspected','confirmed','not_applicable')),
  input_name text,
  input_quantity numeric check (input_quantity is null or input_quantity >= 0),
  input_unit text,
  yield_quantity numeric check (yield_quantity is null or yield_quantity >= 0),
  yield_unit text,
  source text not null default 'farmer_report',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agricultural_records_farm_org_fk foreign key (farm_id, organization_id) references public.farms(id, organization_id) on delete cascade
);
create index if not exists agricultural_records_farm_date_idx on public.agricultural_records (farm_id, occurred_at desc, created_at desc);
create index if not exists agricultural_records_org_date_idx on public.agricultural_records (organization_id, occurred_at desc);
alter table public.agricultural_records enable row level security;
create policy agricultural_records_select_members on public.agricultural_records for select to authenticated using (private.is_org_member(organization_id));
create policy agricultural_records_insert_field_team on public.agricultural_records for insert to authenticated with check (created_by = (select auth.uid()) and private.has_org_role(organization_id, array['owner','admin','manager','agronomist','field_operator']::text[]));
create policy agricultural_records_update_agri_team on public.agricultural_records for update to authenticated using (private.has_org_role(organization_id, array['owner','admin','manager','agronomist']::text[])) with check (private.has_org_role(organization_id, array['owner','admin','manager','agronomist']::text[]));
create policy agricultural_records_delete_managers on public.agricultural_records for delete to authenticated using (private.has_org_role(organization_id, array['owner','admin','manager']::text[]));
grant select, insert, update, delete on public.agricultural_records to authenticated;
comment on table public.agricultural_records is 'Chronological farm activity and field observations. Records are user-reported, not automatically verified diagnoses.';
comment on column public.agricultural_records.source is 'Provenance label, e.g. farmer_report, field_observation, laboratory, agronomist_report.';
comment on column public.agricultural_records.observation_status is 'Observed, suspected or confirmed by the reporting source; not a platform-generated diagnosis.';
