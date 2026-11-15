import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoundaryEditor from "./BoundaryEditor";

type PolygonGeometry = { type: "Polygon"; coordinates: number[][][] };

export default async function FarmBoundaryPage({ params, searchParams }: {
  params: Promise<{ farmId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { farmId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase.from("memberships")
    .select("organization_id,role").eq("user_id", user.id).eq("status", "active");
  const organizationIds = (memberships ?? []).map((item) => item.organization_id);
  if (!organizationIds.length) notFound();

  const { data: farm } = await supabase.from("farms")
    .select("id,name,latitude,longitude,area_hectares,boundary_area_hectares,organization_id")
    .eq("id", farmId).in("organization_id", organizationIds).maybeSingle();
  if (!farm) notFound();

  const role = memberships?.find((item) => item.organization_id === farm.organization_id)?.role ?? "viewer";
  const canEdit = ["owner", "admin", "manager"].includes(role);
  const { data: boundaryRows, error: boundaryError } = await supabase.rpc("get_farm_boundary", { p_farm_id: farmId });
  const row = boundaryRows?.[0];
  const initialGeometry = row?.boundary_geojson as PolygonGeometry | null | undefined;

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/farms"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
        <nav className="top-nav"><Link href="/farms">EXPLORAÇÕES ↗</Link><Link href="/insights">ANÁLISES ↗</Link><Link href="/monitoring">MONITORIZAÇÃO ↗</Link></nav>
      </header>
      <section className="farm-hero">
        <span className="eyebrow">02 / DELIMITAÇÃO GEOGRÁFICA</span>
        <h1>Defina os limites<br/><em>da propriedade.</em></h1>
        <p className="hero-copy">{farm.name} · Desenhe o polígono real do terreno para criar uma referência espacial para as próximas análises.</p>
      </section>
      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">MAPEAMENTO DA EXPLORAÇÃO</span><h2>{farm.name}</h2></div><span className="status-tag">{initialGeometry ? "DELIMITAÇÃO GUARDADA" : "SEM DELIMITAÇÃO"}</span></div>
        {query.saved && <p className="form-message" role="status">Delimitação guardada. A área geodésica foi calculada no servidor.</p>}
        {query.error && <p className="auth-error" role="alert">{query.error}</p>}
        {boundaryError && <p className="auth-error" role="alert">Não foi possível carregar a delimitação existente.</p>}
        <div className="farm-facts">
          <span>COORDENADAS DE REFERÊNCIA<strong>{farm.latitude ?? "—"}, {farm.longitude ?? "—"}</strong></span>
          <span>ÁREA DECLARADA<strong>{farm.area_hectares === null ? "Não informada" : `${farm.area_hectares} ha`}</strong></span>
          <span>ÁREA DELIMITADA<strong>{row?.boundary_area_hectares == null ? "Ainda não calculada" : `${Number(row.boundary_area_hectares).toFixed(4)} ha`}</strong></span>
        </div>
        <BoundaryEditor farmId={farm.id} latitude={farm.latitude} longitude={farm.longitude}
          initialGeometry={initialGeometry ?? null} initialArea={row?.boundary_area_hectares ?? null} canEdit={canEdit} />
      </section>
      <footer><span>SPACEXPLORE TCHIOWA</span><span>GEOMETRIA VALIDADA · WGS84 / SRID 4326</span></footer>
    </main>
  );
}
