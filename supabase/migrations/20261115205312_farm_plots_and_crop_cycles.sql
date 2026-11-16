-- Farm plots, crop cycles and links from field activity records.
create table public.farm_plots (
 id uuid primary key default gen_random_uuid(),farm_id uuid not null,organization_id uuid not null,
 name text not null check(char_length(trim(name)) between 2 and 100),
 boundary extensions.geometry(Polygon,4326) not null,area_hectares numeric(14,4) not null check(area_hectares>0),
 notes text,created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint farm_plots_farm_org_fk foreign key(farm_id,organization_id) references public.farms(id,organization_id) on delete cascade
);
create unique index farm_plots_id_farm_org_uidx on public.farm_plots(id,farm_id,organization_id);
create index farm_plots_farm_idx on public.farm_plots(farm_id,created_at);
create index farm_plots_boundary_gix on public.farm_plots using gist(boundary);
alter table public.farm_plots enable row level security;
create policy farm_plots_select_members on public.farm_plots for select to authenticated using(private.is_org_member(organization_id));
create policy farm_plots_insert_field_team on public.farm_plots for insert to authenticated with check(created_by=(select auth.uid()) and private.has_org_role(organization_id,array['owner','admin','manager','agronomist','field_operator']::text[]));
create policy farm_plots_update_agri_team on public.farm_plots for update to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager','agronomist']::text[])) with check(private.has_org_role(organization_id,array['owner','admin','manager','agronomist']::text[]));
create policy farm_plots_delete_managers on public.farm_plots for delete to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager']::text[]));
grant select,insert,update,delete on public.farm_plots to authenticated;

create table public.farm_crop_cycles (
 id uuid primary key default gen_random_uuid(),plot_id uuid not null,farm_id uuid not null,organization_id uuid not null,
 crop_name text not null check(char_length(trim(crop_name)) between 2 and 100),variety text,planting_date date,
 expected_harvest_date date,actual_harvest_date date,
 status text not null default 'planned' check(status in ('planned','planted','growing','harvested','failed','cancelled')),
 source text not null default 'farmer_report' check(source in ('farmer_report','field_observation','agronomist_report')),
 notes text,created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint farm_crop_cycles_plot_farm_org_fk foreign key(plot_id,farm_id,organization_id) references public.farm_plots(id,farm_id,organization_id) on delete cascade,
 constraint farm_crop_cycles_dates_check check((planting_date is null or expected_harvest_date is null or expected_harvest_date>=planting_date) and (actual_harvest_date is null or planting_date is null or actual_harvest_date>=planting_date)),
 constraint farm_crop_cycles_status_dates_check check(status not in ('planted','growing','harvested') or planting_date is not null),
 constraint farm_crop_cycles_harvest_date_check check(status<>'harvested' or actual_harvest_date is not null)
);
create unique index farm_crop_cycles_id_plot_farm_org_uidx on public.farm_crop_cycles(id,plot_id,farm_id,organization_id);
create index farm_crop_cycles_plot_date_idx on public.farm_crop_cycles(plot_id,planting_date desc,created_at desc);
create unique index farm_crop_cycles_one_active_per_plot_uidx on public.farm_crop_cycles(plot_id) where status in ('planned','planted','growing');
alter table public.farm_crop_cycles enable row level security;
create policy farm_crop_cycles_select_members on public.farm_crop_cycles for select to authenticated using(private.is_org_member(organization_id));
create policy farm_crop_cycles_insert_field_team on public.farm_crop_cycles for insert to authenticated with check(created_by=(select auth.uid()) and private.has_org_role(organization_id,array['owner','admin','manager','agronomist','field_operator']::text[]));
create policy farm_crop_cycles_update_agri_team on public.farm_crop_cycles for update to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager','agronomist']::text[])) with check(private.has_org_role(organization_id,array['owner','admin','manager','agronomist']::text[]));
create policy farm_crop_cycles_delete_managers on public.farm_crop_cycles for delete to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager']::text[]));
grant select,insert,update,delete on public.farm_crop_cycles to authenticated;

alter table public.agricultural_records add column plot_id uuid,add column crop_cycle_id uuid;
alter table public.agricultural_records add constraint agricultural_records_plot_fk foreign key(plot_id,farm_id,organization_id) references public.farm_plots(id,farm_id,organization_id) on delete set null(plot_id),
 add constraint agricultural_records_crop_cycle_fk foreign key(crop_cycle_id,plot_id,farm_id,organization_id) references public.farm_crop_cycles(id,plot_id,farm_id,organization_id) on delete set null(crop_cycle_id);
create index agricultural_records_plot_date_idx on public.agricultural_records(plot_id,occurred_at desc) where plot_id is not null;

create or replace function public.create_farm_plot(p_farm_id uuid,p_name text,p_geojson jsonb,p_crop_name text,p_variety text default null,p_planting_date date default null,p_expected_harvest_date date default null,p_crop_status text default 'planned',p_notes text default null)
returns table(plot_id uuid,area_hectares numeric,crop_cycle_id uuid) language plpgsql security invoker set search_path=''
as $$
declare v_org_id uuid;v_farm_boundary extensions.geometry;v_geom extensions.geometry;v_area numeric;v_plot_id uuid;v_cycle_id uuid;
begin
 if p_name is null or char_length(trim(p_name))<2 or char_length(trim(p_name))>100 then raise exception 'O nome do talhão deve ter entre 2 e 100 caracteres.';end if;
 if p_crop_name is null or char_length(trim(p_crop_name))<2 or char_length(trim(p_crop_name))>100 then raise exception 'Indique a cultura principal deste talhão.';end if;
 if p_crop_status not in('planned','planted','growing') then raise exception 'Estado inicial da cultura inválido.';end if;
 if p_crop_status in('planted','growing') and p_planting_date is null then raise exception 'Indique a data de plantio para uma cultura já plantada.';end if;
 if p_planting_date is not null and p_expected_harvest_date is not null and p_expected_harvest_date<p_planting_date then raise exception 'A previsão de colheita não pode anteceder o plantio.';end if;
 select f.organization_id,f.boundary into v_org_id,v_farm_boundary from public.farms f where f.id=p_farm_id;
 if not found or v_farm_boundary is null then raise exception 'A fazenda precisa de uma delimitação geográfica guardada antes de criar talhões.';end if;
 if not private.has_org_role(v_org_id,array['owner','admin','manager','agronomist','field_operator']::text[]) then raise exception 'Sem permissão para criar talhões nesta fazenda.';end if;
 if p_geojson is null or jsonb_typeof(p_geojson)<>'object' or p_geojson->>'type'<>'Polygon' then raise exception 'A delimitação do talhão deve ser um GeoJSON Polygon.';end if;
 v_geom:=extensions.st_setsrid(extensions.st_geomfromgeojson(p_geojson::text),4326);
 if extensions.st_geometrytype(v_geom)<>'ST_Polygon' or extensions.st_isempty(v_geom) or not extensions.st_isvalid(v_geom) or extensions.st_npoints(v_geom)<4 then raise exception 'O polígono do talhão é inválido. Verifique os pontos e os limites.';end if;
 if not extensions.st_coveredby(v_geom,v_farm_boundary) then raise exception 'O talhão tem de ficar totalmente dentro dos limites da fazenda.';end if;
 if exists(select 1 from public.farm_plots fp where fp.farm_id=p_farm_id and fp.boundary&&v_geom and extensions.st_area(extensions.st_intersection(fp.boundary,v_geom)::extensions.geography)>1) then raise exception 'Este talhão sobrepõe-se a outro talhão já registado. Ajuste os limites.';end if;
 v_area:=round((extensions.st_area(v_geom::extensions.geography)/10000.0)::numeric,4);
 if v_area<=0 then raise exception 'A área calculada do talhão deve ser superior a zero.';end if;
 insert into public.farm_plots(farm_id,organization_id,name,boundary,area_hectares,notes,created_by) values(p_farm_id,v_org_id,trim(p_name),v_geom,v_area,nullif(trim(coalesce(p_notes,'')),''),(select auth.uid())) returning id into v_plot_id;
 insert into public.farm_crop_cycles(plot_id,farm_id,organization_id,crop_name,variety,planting_date,expected_harvest_date,status,notes,created_by) values(v_plot_id,p_farm_id,v_org_id,trim(p_crop_name),nullif(trim(coalesce(p_variety,'')),''),p_planting_date,p_expected_harvest_date,p_crop_status,nullif(trim(coalesce(p_notes,'')),''),(select auth.uid())) returning id into v_cycle_id;
 return query select v_plot_id,v_area,v_cycle_id;
end;$$;
revoke all on function public.create_farm_plot(uuid,text,jsonb,text,text,date,date,text,text) from public,anon;
grant execute on function public.create_farm_plot(uuid,text,jsonb,text,text,date,date,text,text) to authenticated;
comment on table public.farm_plots is 'Georeferenced management plots contained within a farm boundary. Area is calculated geodesically by PostGIS.';
comment on table public.farm_crop_cycles is 'Crop cycles assigned to individual farm plots. Dates and status are farmer/agronomist supplied, not satellite-inferred.';
comment on column public.agricultural_records.plot_id is 'Optional plot reference for a field activity or observation.';
comment on column public.agricultural_records.crop_cycle_id is 'Optional crop-cycle reference; must belong to the selected plot and farm.';
