"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Farm = { id:string; name:string; current_crop:string|null; location_label?:string|null };
type RecordItem = { id:string; record_type:string; title:string; occurred_at:string; crop:string|null; description:string|null; source:string; yield_quantity:number|null; yield_unit:string|null };

const labels:Record<string,string>={planting:"Plantio",harvest:"Colheita",field_observation:"Observação",pest_disease:"Praga/doença observada",fertilizer:"Fertilização",treatment:"Tratamento",yield:"Produção",other:"Outro"};

export default function MonitoringPage(){
 const [farms,setFarms]=useState<Farm[]>([]);
 const [selected,setSelected]=useState("");
 const [records,setRecords]=useState<RecordItem[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{try{const r=await fetch("/api/farms",{cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error??"Não foi possível carregar explorações.");if(!active)return;setFarms(j.farms??[]);if(j.farms?.length)setSelected(j.farms[0].id);}catch(e){if(active)setError(e instanceof Error?e.message:"Erro ao carregar explorações.");}finally{if(active)setLoading(false);}})();return()=>{active=false}},[]);
 useEffect(()=>{if(!selected){setRecords([]);return;}let active=true;(async()=>{try{setError("");const r=await fetch(`/api/farms/${selected}/records`,{cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error??"Não foi possível carregar registos.");if(active)setRecords(j.records??[]);}catch(e){if(active)setError(e instanceof Error?e.message:"Erro ao carregar histórico.");}})();return()=>{active=false}},[selected]);
 const farm=farms.find(f=>f.id===selected);
 const planting=useMemo(()=>records.filter(r=>r.record_type==="planting").sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)),[records]);
 const harvest=useMemo(()=>records.filter(r=>r.record_type==="harvest"||r.record_type==="yield").sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)),[records]);
 const latestPlanting=planting[0];
 const harvestAfterPlanting=latestPlanting?harvest.find(r=>r.occurred_at>=latestPlanting.occurred_at):undefined;
 const observations=records.filter(r=>["field_observation","pest_disease"].includes(r.record_type));
 return <main className="shell">
  <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link><nav className="top-nav"><Link href="/farms">EXPLORAÇÕES ↗</Link><Link href="/crops">CULTURAS ↗</Link><Link href="/insights">ANÁLISES ↗</Link></nav></header>
  <section className="farm-hero"><span className="eyebrow">06 / MONITORIZAÇÃO AGRÍCOLA</span><h1>Acompanhe<br/><em>o que acontece.</em></h1><p className="hero-copy">Uma visão cronológica dos plantios, observações e colheitas declarados para cada exploração. O estado apresentado depende dos registos existentes, não de previsões automáticas.</p></section>
  <section className="workspace"><div className="section-heading"><div><span className="eyebrow">EXPLORAÇÃO</span><h2>Selecionar propriedade</h2></div><span className="status-tag">HISTÓRICO REAL</span></div>
   {loading?<p className="section-copy">A carregar explorações…</p>:farms.length?<label className="rotation-farm-select">EXPLORAÇÃO REGISTADA<select value={selected} onChange={e=>setSelected(e.target.value)}>{farms.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>:<div className="empty-state"><strong>Sem explorações disponíveis.</strong><p>Registe uma exploração para começar a acompanhar a atividade agrícola.</p><Link href="/farms">ABRIR EXPLORAÇÕES ↗</Link></div>}
   {error&&<div className="notice error" role="alert">{error}</div>}
  </section>
  {farm&&<><section className="workspace"><div className="section-heading"><div><span className="eyebrow">CICLO REGISTADO</span><h2>{farm.name}</h2></div><span className="status-tag">{records.length} REGISTOS ANALISADOS</span></div>
   <div className="readiness-grid">
    <article className="readiness-card"><strong>Último plantio</strong><p>{latestPlanting?latestPlanting.occurred_at:"Sem plantio registado"}</p>{latestPlanting&&<small>{latestPlanting.crop??farm.current_crop??"Cultura não indicada"}</small>}</article>
    <article className="readiness-card"><strong>Colheita após o último plantio</strong><p>{harvestAfterPlanting?harvestAfterPlanting.occurred_at:"Ainda não registada"}</p><small>{harvestAfterPlanting?harvestAfterPlanting.title:"Não significa que a cultura ainda esteja no campo; apenas não há colheita posterior registada."}</small></article>
    <article className="readiness-card"><strong>Observações de campo</strong><p>{observations.length}</p><small>Observações e ocorrências registadas no histórico.</small></article>
   </div>
   <div className="notice">Limite de interpretação: esta página acompanha eventos documentados. Não calcula dias até à maturação, fase fenológica, risco fitossanitário, necessidade de água ou previsão de produtividade. Esses indicadores exigem dados específicos da cultura, variedade, data de plantio e métodos agronómicos validados.</div>
   <div className="section-heading"><div><span className="eyebrow">LINHA DO TEMPO</span><h2>Eventos da exploração</h2></div><Link href={`/farms/${farm.id}/records`}>ADICIONAR REGISTO ↗</Link></div>
   {records.length?<div className="farm-cards">{records.map(r=><article className="farm-card" key={r.id}><div className="farm-card-top"><span className="eyebrow">{labels[r.record_type]??r.record_type}</span><span className="status-tag">{r.occurred_at}</span></div><h3>{r.title}</h3>{r.crop&&<p>Cultura: {r.crop}</p>}{r.description&&<p className="section-copy">{r.description}</p>}{r.yield_quantity!==null&&<p>Produção declarada: {r.yield_quantity} {r.yield_unit??""}</p>}<small>Origem: {r.source.replaceAll("_"," ")}</small></article>)}</div>:<div className="empty-state"><strong>Sem eventos registados.</strong><p>Adicione o primeiro plantio ou observação para iniciar a linha do tempo.</p></div>}
  </section></>}
  <footer><span>SPACEXPLORE TCHIOWA</span><span>MONITORIZAÇÃO BASEADA EM REGISTOS</span></footer>
 </main>;
}
