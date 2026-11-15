import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FarmPlotsWorkspace from "./FarmPlotsWorkspace";
type PolygonGeometry={type:"Polygon";coordinates:number[][][]};

export default async function FarmPlotsPage({params,searchParams}:{params:Promise<{farmId:string}>;searchParams:Promise<{saved?:string;updated?:string;error?:string}>}){
 const {farmId}=await params;const query=await searchParams;const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:farm}=await supabase.from("farms").select("id,name,organization_id,latitude,longitude,boundary_area_hectares").eq("id",farmId).maybeSingle();
 if(!farm)notFound();
 const {data:membership}=await supabase.from("memberships").select("role").eq("organization_id",farm.organization_id).eq("user_id",user.id).eq("status","active").maybeSingle();
 if(!membership)notFound();
 const [{data:boundaryRows,error:boundaryError},{data:plotRows,error:plotError},{data:cycles,error:cycleError}]=await Promise.all([
  supabase.rpc("get_farm_boundary",{p_farm_id:farmId}),supabase.rpc("get_farm_plots",{p_farm_id:farmId}),
  supabase.from("farm_crop_cycles").select("id,plot_id,crop_name,variety,planting_date,expected_harvest_date,actual_harvest_date,status,source,notes").eq("farm_id",farmId).order("created_at",{ascending:false})
 ]);
 const farmBoundary=boundaryRows?.[0]?.boundary_geojson as PolygonGeometry|null|undefined;
 const plots=(plotRows??[]).map(plot=>({id:plot.id,name:plot.name,area_hectares:Number(plot.area_hectares),notes:plot.notes,boundary_geojson:plot.boundary_geojson as PolygonGeometry,cycles:(cycles??[]).filter(cycle=>cycle.plot_id===plot.id)}));
 const canEdit=["owner","admin","manager","agronomist","field_operator"].includes(membership.role);
 return <main className="shell">
  <header className="topbar"><Link className="brand" href="/farms"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link><nav className="top-nav"><Link href="/farms">EXPLORAÇÕES ↗</Link><Link href={`/farms/${farmId}/boundary`}>LIMITES DA FAZENDA ↗</Link><Link href={`/farms/${farmId}/records`}>HISTÓRICO AGRÍCOLA ↗</Link></nav></header>
  <section className="farm-hero"><span className="eyebrow">03 / GESTÃO ESPACIAL DE CULTURAS</span><h1>{farm.name}<br/><em>talhão por talhão.</em></h1><p className="hero-copy">Divida a propriedade em unidades de maneio, registe a cultura de cada área e acompanhe os ciclos agrícolas e ocorrências.</p></section>
  {query.saved&&<p className="form-message" role="status">{query.saved==="cycle"?"Novo ciclo agrícola registado.":"Talhão e primeiro ciclo de cultura guardados com sucesso."}</p>}
  {query.updated&&<p className="form-message" role="status">Estado do ciclo actualizado.</p>}
  {query.error&&<p className="auth-error" role="alert">{query.error}</p>}
  {(boundaryError||plotError||cycleError)&&<p className="auth-error" role="alert">Não foi possível carregar todos os dados espaciais e agrícolas. Actualize a página.</p>}
  {!farmBoundary?<section className="workspace"><div className="empty-state"><strong>Primeiro, delimite a fazenda.</strong><p>Os talhões têm de ficar dentro do polígono da propriedade. Guarde os limites gerais antes de criar divisões internas.</p><Link href={`/farms/${farmId}/boundary`}>DELIMITAR FAZENDA ↗</Link></div></section>:<section className="workspace farm-workspace">
   <div className="farm-facts"><span>ÁREA DA FAZENDA<strong>{farm.boundary_area_hectares==null?"Não calculada":Number(farm.boundary_area_hectares).toFixed(4)+" ha"}</strong></span><span>TALHÕES REGISTADOS<strong>{plots.length}</strong></span><span>MEMBRO<strong>{membership.role}</strong></span></div>
   <FarmPlotsWorkspace farmId={farmId} farmName={farm.name} latitude={farm.latitude} longitude={farm.longitude} farmBoundary={farmBoundary} plots={plots} canEdit={canEdit}/>
  </section>}
  <footer><span>SPACEXPLORE TCHIOWA</span><span>TALHÕES WGS84 · ÁREA GEODÉSICA POSTGIS · CICLOS DECLARADOS</span></footer>
 </main>;
}
