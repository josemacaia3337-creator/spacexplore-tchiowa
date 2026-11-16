create or replace function public.get_farm_plots(p_farm_id uuid)
returns table(id uuid,name text,area_hectares numeric,notes text,boundary_geojson jsonb,created_at timestamptz)
language sql stable security invoker set search_path=''
as $$ select fp.id,fp.name,fp.area_hectares,fp.notes,extensions.st_asgeojson(fp.boundary)::jsonb,fp.created_at from public.farm_plots fp where fp.farm_id=p_farm_id order by fp.created_at asc; $$;
revoke all on function public.get_farm_plots(uuid) from public,anon;
grant execute on function public.get_farm_plots(uuid) to authenticated;