import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateFarm, deleteFarm } from "./actions";
import FarmRegistrationForm from "./FarmRegistrationForm";

const soilLabels: Record<string,string> = {
  sandy:"Arenoso", loamy_sand:"Franco-arenoso", loam:"Franco", silty:"Siltoso",
  clay_loam:"Franco-argiloso", clay:"Argiloso", unknown:"Desconhecido",
};
const drainageLabels: Record<string,string> = {
  well_drained:"Bem drenado", moderate:"Moderadamente drenado",
  poor:"Mal drenado", unknown:"Não avaliado",
};

export default async function FarmsPage({searchParams}:{searchParams:Promise<{saved?:string;mapped?:string;needsBoundary?:string;deleted?:string;updated?:string;error?:string}>}) {
  const params=await searchParams;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");

  const {data: memberships,error:membershipError}=await supabase.from("memberships")
    .select("organization_id,role,organizations(name,slug)")
    .eq("user_id",user.id).eq("status","active");
  const organizationIds=(memberships??[]).map(m=>m.organization_id);
  const {data: farms,error:farmError}=organizationIds.length
    ? await supabase.from("farms").select("id,organization_id,name,location_label,latitude,longitude,area_hectares,boundary_area_hectares,soil_texture,soil_ph,organic_matter_pct,drainage_class,current_crop,soil_data_source,soil_observed_at,notes,created_at").in("organization_id",organizationIds).order("created_at",{ascending:false})
    : {data:[],error:null};
  const canManage=(memberships??[]).some(m=>["owner","admin","manager"].includes(m.role));

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/dashboard"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
        <nav className="top-nav"><Link href="/dashboard">PAINEL ↗</Link><Link href="/crops">CULTURAS ↗</Link><Link href="/rotation">ROTAÇÃO ↗</Link><Link href="/insights">ANÁLISES ↗</Link><Link href="/monitoring">MONITORIZAÇÃO ↗</Link></nav>
      </header>

      <section className="farm-hero">
        <span className="eyebrow">02 / INTELIGÊNCIA DAS EXPLORAÇÕES</span>
        <h1>Conheça o seu<br/><em>terreno.</em></h1>
        <p className="hero-copy">Registe propriedades agrícolas e associe informação de localização, culturas e observações do solo à sua organização.</p>
      </section>

      <section className="workspace farm-workspace">
        <div className="section-heading"><div><span className="eyebrow">GESTÃO DE PROPRIEDADES</span><h2>Nova exploração</h2></div><span className="status-tag">SINCRONIZADO COM A NUVEM</span></div>
        <p className="section-copy">Os dados são guardados na base de dados e ficam disponíveis aos membros autorizados da organização. Informação do solo deve ser fornecida pelo agricultor, observação de campo ou laboratório — nunca inferida apenas pelas coordenadas.</p>

        {params.saved&&<p className="form-message" role="status">{params.mapped ? "Fazenda e delimitação geográfica guardadas com sucesso." : "Fazenda guardada com sucesso na nuvem."}</p>}{params.needsBoundary&&<p className="notice">A fazenda foi guardada. Pode concluir a delimitação no mapa a partir do cartão da propriedade.</p>}
        {params.deleted&&<p className="form-message" role="status">Exploração removida.</p>}
        {params.updated&&<p className="form-message" role="status">Exploração atualizada com sucesso.</p>}
        {params.error&&<p className="auth-error" role="alert">{params.error}</p>}
        {membershipError&&<p className="auth-error" role="alert">Não foi possível consultar as suas organizações.</p>}

        {canManage&&memberships?.length ? (
          <FarmRegistrationForm organizations={(memberships??[]).filter(m=>["owner","admin","manager"].includes(m.role)).map(m=>({id:m.organization_id,name:((m.organizations as {name:string;slug:string}[]|null)?.[0]?.name??"Organização")}))} defaultOrganizationId={organizationIds.length===1?organizationIds[0]:""} />
        ) : (
          <div className="empty-state"><strong>{memberships?.length?"A sua função não permite criar explorações.":"Ainda não pertence a uma organização."}</strong><p>{memberships?.length?"Peça a um proprietário ou administrador que lhe atribua uma função de gestão.":"Crie primeiro uma organização no seu painel de trabalho."}</p><Link href="/dashboard">IR PARA O PAINEL ↗</Link></div>
        )}
      </section>

      <section className="farm-list-section">
        <div className="section-heading"><div><span className="eyebrow">DADOS REGISTADOS</span><h2>As suas explorações</h2></div><span className="status-tag">{farms?.length??0} REGISTADAS</span></div>
        {farmError?<p className="auth-error">Não foi possível carregar as explorações. Atualize a página ou contacte o administrador.</p>:!farms?.length?(
          <div className="empty-state"><strong>Nenhuma exploração registada.</strong><p>Quando criar a primeira, ficará associada à organização e sincronizada com a nuvem.</p></div>
        ):(
          <div className="farm-cards">{farms.map(farm=>{
            const membership=memberships?.find(m=>m.organization_id===farm.organization_id);
            const role=membership?.role??"viewer";
            const org=(membership?.organizations as {name:string;slug:string}[]|null)?.[0];
            return <article className="farm-card" key={farm.id}>
              <div className="farm-card-top"><span className="eyebrow">EXPLORAÇÃO · {org?.name??"ORGANIZAÇÃO"}</span>
                {["owner","admin"].includes(role)&&<form action={deleteFarm}><input type="hidden" name="farm_id" value={farm.id}/><button className="delete-button" type="submit">REMOVER</button></form>}
              </div>
              <h3>{farm.name}</h3><p className="farm-location">{farm.location_label??"Localização não indicada"}</p>
              <div className="farm-facts">
                <span>LATITUDE / LONGITUDE<strong>{farm.latitude}, {farm.longitude}</strong></span>
                <span>ÁREA DECLARADA<strong>{farm.area_hectares===null?"Não informada":`${farm.area_hectares} ha`}</strong></span>
                <span>ÁREA DELIMITADA<strong>{farm.boundary_area_hectares===null?"Ainda não delimitada":`${farm.boundary_area_hectares} ha`}</strong></span>
                <span>CULTURA PRINCIPAL<strong>{farm.current_crop??"Não informada"}</strong></span>
                <span>TEXTURA DO SOLO<strong>{farm.soil_texture?soilLabels[farm.soil_texture]??farm.soil_texture:"Não analisada"}</strong></span>
                <span>pH DO SOLO<strong>{farm.soil_ph??"Não medido"}</strong></span>
                <span>MATÉRIA ORGÂNICA<strong>{farm.organic_matter_pct===null?"Não medida":`${farm.organic_matter_pct}%`}</strong></span>
                <span>DRENAGEM<strong>{farm.drainage_class?drainageLabels[farm.drainage_class]??farm.drainage_class:"Não avaliada"}</strong></span>
                <span>FONTE DO SOLO<strong>{farm.soil_data_source??"Não indicada"}</strong></span>
              </div>
              
              {["owner","admin","manager"].includes(role)&&<details className="farm-edit-panel">
                <summary>EDITAR DADOS DA EXPLORAÇÃO</summary>
                <form className="farm-form farm-edit-form" action={updateFarm}>
                  <input type="hidden" name="farm_id" value={farm.id}/>
                  <div className="form-grid">
                    <label>NOME *<input name="name" required minLength={2} maxLength={120} defaultValue={farm.name}/></label>
                    <label>LOCALIDADE<input name="location_label" defaultValue={farm.location_label??""}/></label>
                    <label>LATITUDE *<input name="latitude" type="number" min="-90" max="90" step="any" required defaultValue={farm.latitude}/></label>
                    <label>LONGITUDE *<input name="longitude" type="number" min="-180" max="180" step="any" required defaultValue={farm.longitude}/></label>
                    <label>ÁREA (HECTARES)<input name="area_hectares" type="number" min="0.01" step="any" defaultValue={farm.area_hectares??""}/></label>
                    <label>CULTURA ATUAL / PRINCIPAL<input name="current_crop" defaultValue={farm.current_crop??""}/></label>
                    <label>TEXTURA DO SOLO<select name="soil_texture" defaultValue={farm.soil_texture??""}><option value="">Não informado</option><option value="sandy">Arenoso</option><option value="loamy_sand">Franco-arenoso</option><option value="loam">Franco</option><option value="silty">Siltoso</option><option value="clay_loam">Franco-argiloso</option><option value="clay">Argiloso</option><option value="unknown">Desconhecido</option></select></label>
                    <label>pH DO SOLO<input name="soil_ph" type="number" min="0" max="14" step="0.1" defaultValue={farm.soil_ph??""}/></label>
                    <label>MATÉRIA ORGÂNICA (%)<input name="organic_matter_pct" type="number" min="0" max="100" step="0.1" defaultValue={farm.organic_matter_pct??""}/></label>
                    <label>DRENAGEM<select name="drainage_class" defaultValue={farm.drainage_class??""}><option value="">Não informado</option><option value="well_drained">Bem drenado</option><option value="moderate">Moderadamente drenado</option><option value="poor">Mal drenado</option><option value="unknown">Não avaliado</option></select></label>
                    <label>FONTE DO SOLO<input name="soil_data_source" defaultValue={farm.soil_data_source??""}/></label>
                    <label>DATA DA OBSERVAÇÃO<input name="soil_observed_at" type="date" defaultValue={farm.soil_observed_at??""}/></label>
                  </div>
                  <label className="full-label">NOTAS<textarea name="notes" rows={3} defaultValue={farm.notes??""}/></label>
                  <button className="primary-button" type="submit">GUARDAR ALTERAÇÕES ↗</button>
                </form>
              </details>}
              <div className="farm-actions"><Link className="farm-climate-link" href={`/farms/${farm.id}/boundary`}>DELIMITAR NO MAPA ↗</Link><Link className="farm-climate-link" href={"/farms/"+farm.id+"/records"}>ABRIR HISTÓRICO AGRÍCOLA ↗</Link><Link className="farm-climate-link" href={farm.latitude!==null&&farm.longitude!==null?`/?latitude=${farm.latitude}&longitude=${farm.longitude}&farm=${encodeURIComponent(farm.name)}`:"/"}>CONSULTAR CONTEXTO CLIMÁTICO ↗</Link></div>
              <p className="farm-disclaimer">Registo na nuvem. Os dados do solo são declarações ou medições fornecidas, não estimativas por satélite.</p>
            </article>;
          })}</div>
        )}
      </section>
      <footer><span>SPACEXPLORE TCHIOWA</span><span>PERFIS DE EXPLORAÇÃO · DADOS COM PROVENIÊNCIA</span></footer>
    </main>
  );
}
