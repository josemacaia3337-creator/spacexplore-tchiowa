-- Supabase migration: initial identity, organizations, memberships and farms.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','agronomist','field_operator','viewer')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  location_label text,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  area_hectares numeric(14,4) check (area_hectares is null or area_hectares > 0),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null))
);
create index if not exists memberships_user_org_idx on public.memberships(user_id, organization_id) where status = 'active';
create index if not exists farms_organization_idx on public.farms(organization_id);
create index if not exists farms_created_by_idx on public.farms(created_by);
create index if not exists organizations_created_by_idx on public.organizations(created_by);

create or replace function private.has_org_role(target_org uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.memberships m where m.organization_id = target_org
 and m.user_id = (select auth.uid()) and m.status = 'active' and m.role = any(allowed_roles));
$$;
create or replace function private.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.memberships m where m.organization_id = target_org
 and m.user_id = (select auth.uid()) and m.status = 'active');
$$;
revoke all on function private.has_org_role(uuid, text[]) from public, anon;
revoke all on function private.is_org_member(uuid) from public, anon;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.farms enable row level security;

create policy "profiles_select_self" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "organizations_select_members" on public.organizations for select to authenticated using (private.is_org_member(id));
create policy "organizations_insert_creator" on public.organizations for insert to authenticated with check (created_by = (select auth.uid()));
create policy "organizations_update_admins" on public.organizations for update to authenticated using (private.has_org_role(id, array['owner','admin'])) with check (private.has_org_role(id, array['owner','admin']));
create policy "organizations_delete_owner" on public.organizations for delete to authenticated using (private.has_org_role(id, array['owner']));

create policy "memberships_select_self_or_admin" on public.memberships for select to authenticated using (user_id = (select auth.uid()) or private.has_org_role(organization_id, array['owner','admin']));
create policy "memberships_insert_owner_or_admin" on public.memberships for insert to authenticated with check (
 (user_id = (select auth.uid()) and role = 'owner' and status = 'active'
  and exists (select 1 from public.organizations o where o.id = organization_id and o.created_by = (select auth.uid())))
 or private.has_org_role(organization_id, array['owner','admin'])
);
create policy "memberships_update_admins" on public.memberships for update to authenticated using (private.has_org_role(organization_id, array['owner','admin'])) with check (private.has_org_role(organization_id, array['owner','admin']));
create policy "memberships_delete_admins" on public.memberships for delete to authenticated using (private.has_org_role(organization_id, array['owner','admin']));

create policy "farms_select_members" on public.farms for select to authenticated using (private.is_org_member(organization_id));
create policy "farms_insert_managers" on public.farms for insert to authenticated with check (created_by = (select auth.uid()) and private.has_org_role(organization_id, array['owner','admin','manager']));
create policy "farms_update_managers" on public.farms for update to authenticated using (private.has_org_role(organization_id, array['owner','admin','manager'])) with check (private.has_org_role(organization_id, array['owner','admin','manager']));
create policy "farms_delete_admins" on public.farms for delete to authenticated using (private.has_org_role(organization_id, array['owner','admin']));

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.farms to authenticated;
