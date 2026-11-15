import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAgriculturalRecord } from "./actions";

const labels:Record<string,string>={planting:"Plantio",harvest:"Colheita",field_observation:"Observação de campo",pest_disease:"Praga ou doença observada",fertilizer:"Fertilização",treatment:"Tratamento",yield:"Produtividade",other:"Outro"};
const statusLabels:Record<string,string>={observed:"Observado",suspected:"Suspeito",confirmed:"Confirmado pela fonte",not_applicable:"Não aplicável"};
const dateFmt=new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeZone:"UTC"});

export default async function FarmRecordsPage({params,searchParams}:{params:Promise<{farmId:string}>;searchParams:Promise<{saved?:string}>}) {
 const {farmId}=await params; const query=await searchParams;
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
 const {data:farm,error}=await supabase.from("farms").select("id,name,organization_id,current_crop").eq("id",farmId).single();
 if(error||!farm) notFound();
 const {data:membership}=await supabase.from("memberships").select("role").eq("organization_id",farm.organization_id).eq("user_id",user.id).eq("status","active").maybeSingle();
 if(!membership) notFound();
 const {data:records,error:recordsError}=await supabase.from("agricultural_records").select("id,record_type,title,description,occurred_at,crop,observation_status,input_name,input_quantity,input_unit,yield_quantity,yield_unit,source,created_at").eq("farm_id",farmId).order("occurred_at",{ascending:false}).order("created_at",{ascending:false});
 const canAdd=["owner","admin","manager","agronomist","field_operator"].includes(membership.role);
 return <main className="shell">
  <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link><nav className="top-nav"><Link href="/farms">EXPLORAÇÕES ↗</Link><Link href="/insights">ANÁLISES ↗</Link></nav></header>
  <section className="farm-hero"><span className="eyebrow">HISTÓRICO AGRÍCOLA / EXPLORAÇÃO</span><h1>{farm.name}<br/><em>ao longo do tempo.</em></h1><p className="hero-copy">Registe atividades, observações e resultados com data, responsável e origem identificável.</p></section>
  {query.saved&&<p className="form-message" role="status">Registo adicionado ao histórico.</p>}
  <section className="workspace farm-workspace"><div className="section-heading"><div><span className="eyebrow">NOVO REGISTO</span><h2>Adicionar ao histórico</h2></div><span className="status-tag">REGISTO COM PROVENIÊNCIA</span></div>
  {canAdd?<form className="farm-form" action={createAgriculturalRecord}><input type="hidden" name="farm_id" value={farm.id}/>
   <div className="form-grid">
    <label>TIPO DE REGISTO *<select name="record_type" required defaultValue="field_observation"><option value="planting">Plantio</option><option value="harvest">Colheita</option><option value="field_observation">Observação de campo</option><option value="pest_disease">Praga ou doença observada</option><option value="fertilizer">Fertilização</option><option value="treatment">Tratamento</option><option value="yield">Produtividade</option><option value="other">Outro</option></select></label>
    <label>DATA *<input type="date" name="occurred_at" required defaultValue={new Date().toISOString().slice(0,10)}/></label>
    <label className="full-label">TÍTULO *<input name="title" required minLength={2} maxLength={160} placeholder="Ex.: Sementeira de milho no talhão norte"/></label>
    <label>CULTURA<input name="crop" defaultValue={farm.current_crop??""} placeholder="Ex.: milho"/></label>
    <label>ESTADO DA OBSERVAÇÃO<select name="observation_status" defaultValue="not_applicable"><option value="not_applicable">Não aplicável</option><option value="observed">Observado</option><option value="suspected">Suspeito / por confirmar</option><option value="confirmed">Confirmado pela fonte responsável</option></select></label>
    <label>INSUMO / PRODUTO<input name="input_name" placeholder="Opcional"/></label>
    <label>QUANTIDADE APLICADA<input type="number" name="input_quantity" min="0" step="any" placeholder="Opcional"/></label>
    <label>UNIDADE DO INSUMO<input name="input_unit" placeholder="Ex.: kg, L, sacos"/></label>
    <label>QUANTIDADE COLHIDA / PRODUÇÃO<input type="number" name="yield_quantity" min="0" step="any" placeholder="Opcional"/></label>
    <label>UNIDADE DA PRODUÇÃO<input name="yield_unit" placeholder="Ex.: kg, toneladas, sacos"/></label>
    <label>ORIGEM DA INFORMAÇÃO<select name="source"><option value="farmer_report">Declaração do agricultor</option><option value="field_observation">Observação de campo</option><option value="agronomist_report">Relatório de agrónomo</option><option value="laboratory">Análise laboratorial</option></select></label>
   </div>
   <label className="full-label">DESCRIÇÃO / CONTEXTO<textarea name="description" rows={4} placeholder="Descreva o que foi realizado ou observado. Em caso de pragas/doenças, registe apenas sinais observados; não é um diagnóstico automático."/></label>
   <button className="primary-button" type="submit">GUARDAR NO HISTÓRICO ↗</button>
  </form>:<p className="section-copy">A sua função permite consultar o histórico, mas não adicionar registos.</p>}
  </section>
  <section className="farm-list-section"><div className="section-heading"><div><span className="eyebrow">LINHA DO TEMPO</span><h2>Atividade registada</h2></div><span className="status-tag">{records?.length??0} REGISTOS</span></div>
  {recordsError?<p className="auth-error">Não foi possível carregar o histórico.</p>:!records?.length?<div className="empty-state"><strong>Sem atividade registada.</strong><p>Os primeiros registos aparecerão aqui por ordem cronológica.</p></div>:
   <div className="farm-cards">{records.map(record=><article className="farm-card" key={record.id}><div className="farm-card-top"><span className="eyebrow">{labels[record.record_type]??record.record_type}</span><span className="status-tag">{dateFmt.format(new Date(record.occurred_at+"T00:00:00Z"))}</span></div><h3>{record.title}</h3>{record.description&&<p className="section-copy">{record.description}</p>}<div className="farm-facts">{record.crop&&<span>CULTURA<strong>{record.crop}</strong></span>}{record.observation_status&&record.observation_status!=="not_applicable"&&<span>ESTADO<strong>{statusLabels[record.observation_status]??record.observation_status}</strong></span>}{record.input_name&&<span>INSUMO<strong>{record.input_name}{record.input_quantity!==null?" · "+record.input_quantity+" "+(record.input_unit??""):""}</strong></span>}{record.yield_quantity!==null&&<span>PRODUÇÃO<strong>{record.yield_quantity} {record.yield_unit??""}</strong></span>}<span>ORIGEM<strong>{record.source}</strong></span></div><p className="farm-disclaimer">Registado por membro autorizado. A plataforma não converte observações em diagnósticos científicos.</p></article>)}</div>}
  </section><footer><span>SPACEXPLORE TCHIOWA</span><span>HISTÓRICO AGRÍCOLA · DADOS COM PROVENIÊNCIA</span></footer>
 </main>;
}
