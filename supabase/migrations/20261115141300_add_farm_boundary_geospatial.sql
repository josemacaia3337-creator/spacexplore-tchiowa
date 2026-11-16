create extension if not exists postgis with schema extensions;

alter table public.farms
  add column if not exists boundary extensions.geometry(Polygon, 4326),
  add column if not exists boundary_area_hectares numeric(14,4);

create index if not exists farms_boundary_gix
  on public.farms using gist (boundary);

comment on column public.farms.boundary is
  'Validated farm boundary polygon in WGS84 (SRID 4326). Null until explicitly delimited.';
comment on column public.farms.boundary_area_hectares is
  'Geodesic area calculated from the saved boundary using PostGIS geography; distinct from previously declared area.';

create or replace function public.save_farm_boundary(p_farm_id uuid, p_geojson jsonb)
returns table(boundary_geojson jsonb, boundary_area_hectares numeric)
language plpgsql
set search_path = ''
as $$
declare
  v_geom extensions.geometry;
  v_area numeric;
begin
  if p_geojson is null or jsonb_typeof(p_geojson) <> 'object'
     or p_geojson->>'type' <> 'Polygon' then
    raise exception 'A geometria deve ser um GeoJSON Polygon.';
  end if;

  v_geom := extensions.st_setsrid(
    extensions.st_geomfromgeojson(p_geojson::text),
    4326
  );

  if extensions.st_geometrytype(v_geom) <> 'ST_Polygon'
     or extensions.st_isempty(v_geom)
     or not extensions.st_isvalid(v_geom)
     or extensions.st_npoints(v_geom) < 4 then
    raise exception 'O polígono é inválido. Verifique os limites e os pontos.';
  end if;

  if extensions.st_xmin(v_geom) < -180 or extensions.st_xmax(v_geom) > 180
     or extensions.st_ymin(v_geom) < -90 or extensions.st_ymax(v_geom) > 90 then
    raise exception 'As coordenadas estão fora dos limites geográficos.';
  end if;

  v_area := round((extensions.st_area(v_geom::extensions.geography) / 10000.0)::numeric, 4);
  if v_area <= 0 then
    raise exception 'A área calculada deve ser superior a zero.';
  end if;

  update public.farms
     set boundary = v_geom,
         boundary_area_hectares = v_area,
         updated_at = now()
   where id = p_farm_id;

  if not found then
    raise exception 'Exploração não encontrada ou sem permissão para alterar os limites.';
  end if;

  return query
    select extensions.st_asgeojson(f.boundary)::jsonb, f.boundary_area_hectares
      from public.farms f
     where f.id = p_farm_id;
end;
$$;

create or replace function public.get_farm_boundary(p_farm_id uuid)
returns table(boundary_geojson jsonb, boundary_area_hectares numeric)
language sql
stable
set search_path = ''
as $$
  select
    case when f.boundary is null then null
         else extensions.st_asgeojson(f.boundary)::jsonb end,
    f.boundary_area_hectares
  from public.farms f
  where f.id = p_farm_id;
$$;

revoke all on function public.save_farm_boundary(uuid, jsonb) from public, anon;
revoke all on function public.get_farm_boundary(uuid) from public, anon;
grant execute on function public.save_farm_boundary(uuid, jsonb) to authenticated;
grant execute on function public.get_farm_boundary(uuid) to authenticated;
