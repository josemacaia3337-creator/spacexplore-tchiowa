"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type ClimateResult = {
  source?: string; retrievedAt?: string; timeStandard?: string; fillValue?: number;
  location?: { latitude: number; longitude: number };
  requestedPeriod?: { start: string; end: string };
  parameters?: Record<string, { units?: string; longname?: string }>;
  data?: { properties?: { parameter?: Record<string, Record<string, number>> } };
  error?: string;
};
const LABELS: Record<string,string> = {T2M:"Temperatura média",T2M_MAX:"Temperatura máxima",T2M_MIN:"Temperatura mínima",PRECTOTCORR:"Precipitação",RH2M:"Humidade relativa"};
const slides = [
 {image:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2200&q=85",eyebrow:"OBSERVAÇÃO DA TERRA",title:<>Compreender a Terra.<br/><em>Transformar a agricultura.</em></>,copy:"Ligamos ciência, dados ambientais e tecnologia para apoiar uma agricultura mais informada, consciente e resiliente."},
 {image:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2200&q=85",eyebrow:"CIÊNCIA E TECNOLOGIA ESPACIAL",title:<>O conhecimento começa<br/><em>muito além do campo.</em></>,copy:"Exploramos dados de observação da Terra e informação ambiental para compreender melhor os contextos agrícolas."},
 {image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=85",eyebrow:"INTELIGÊNCIA AGRÍCOLA",title:<>Cada território tem<br/><em>uma história para revelar.</em></>,copy:"Organize propriedades, acompanhe registos e construa uma visão mais estruturada da realidade agrícola."}
];

export default function Home() {
 const [latitude,setLatitude]=useState("-5.55"),[longitude,setLongitude]=useState("12.19"),[start,setStart]=useState("20250101"),[end,setEnd]=useState("20251231");
 const [result,setResult]=useState<ClimateResult|null>(null),[loading,setLoading]=useState(false),[farmName,setFarmName]=useState("");
 const [menuOpen,setMenuOpen]=useState(false),[activeSlide,setActiveSlide]=useState(0);
 useEffect(()=>{const p=new URLSearchParams(window.location.search),farm=p.get("farm"),lat=p.get("latitude"),lon=p.get("longitude");if(farm)setFarmName(farm);if(lat&&Number.isFinite(Number(lat))&&Number(lat)>=-90&&Number(lat)<=90)setLatitude(lat);if(lon&&Number.isFinite(Number(lon))&&Number(lon)>=-180&&Number(lon)<=180)setLongitude(lon)},[]);
 useEffect(()=>{
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(motion.matches)return;
  let timer:number|undefined;
  const startRotation=()=>{if(document.visibilityState==="visible"&&!timer)timer=window.setInterval(()=>setActiveSlide(c=>(c+1)%slides.length),7000)};
  const stopRotation=()=>{if(timer){window.clearInterval(timer);timer=undefined}};
  const onMotionChange=()=>motion.matches?stopRotation():startRotation();
  document.addEventListener("visibilitychange",startRotation);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="visible")stopRotation()});
  motion.addEventListener?.("change",onMotionChange);
  startRotation();
  return()=>{stopRotation();document.removeEventListener("visibilitychange",startRotation);motion.removeEventListener?.("change",onMotionChange)};
 },[]);
 useEffect(()=>{
  if(!menuOpen)return;
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setMenuOpen(false)};
  const previous=document.body.style.overflow;
  document.body.style.overflow="hidden";
  window.addEventListener("keydown",onKeyDown);
  return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKeyDown)};
 },[menuOpen]);
 async function loadClimate(){setLoading(true);setResult(null);try{const q=new URLSearchParams({latitude,longitude,start,end}),r=await fetch("/api/climate?"+q.toString()),p=await r.json();setResult(r.ok?p:{error:p.error??"Pedido não concluído (HTTP "+r.status+")."})}catch{setResult({error:"Não foi possível carregar os dados climáticos. Verifica a ligação e tenta novamente."})}finally{setLoading(false)}}
 const observations=result?.data?.properties?.parameter,metadata=result?.parameters??{},closeMenu=()=>setMenuOpen(false);
 return <main className="public-site">
  <header className="public-header">
   <Link className="public-brand" href="/" aria-label="SpaceXplore Tchiowa — página inicial"><span className="public-brand-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="17.5" stroke="currentColor" strokeWidth="1"/><ellipse cx="24" cy="24" rx="22" ry="8.5" transform="rotate(-34 24 24)" stroke="currentColor" strokeWidth="1"/><circle cx="35.5" cy="12.2" r="2.3" fill="#b8e4ff"/><path d="M18 29.5 28.5 18M18 18h10.5v11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="public-brand-name">SPACEXPLORE <b>TCHIOWA</b><small>AGRICULTURAL INTELLIGENCE</small></span></Link>
   <div className="public-header-right"><span className="public-edition">EARTH · DATA · AGRICULTURE</span><button className={"menu-trigger "+(menuOpen?"is-open":"")} type="button" aria-expanded={menuOpen} aria-controls="public-menu" onClick={()=>setMenuOpen(!menuOpen)}><span>{menuOpen?"FECHAR":"MENU"}</span><i aria-hidden="true"><b></b><b></b></i></button></div>
   {menuOpen&&<div className="public-menu-backdrop" onClick={closeMenu}/>}
   <nav id="public-menu" className={"public-menu "+(menuOpen?"is-open":"")} aria-label="Menu principal" aria-hidden={!menuOpen}>
    <div className="public-menu-heading"><span>NAVEGAR NA PLATAFORMA</span><span>01 — 06</span></div>
    <a href="#plataforma" onClick={closeMenu}><small>01</small>A plataforma <b>↗</b></a><a href="#capacidades" onClick={closeMenu}><small>02</small>Capacidades <b>↗</b></a><a href="#clima" onClick={closeMenu}><small>03</small>Explorador climático <b>↗</b></a>
    <Link href="/farms" onClick={closeMenu}><small>04</small>Propriedades agrícolas <b>↗</b></Link><Link href="/monitoring" onClick={closeMenu}><small>05</small>Monitorização <b>↗</b></Link><Link href="/insights" onClick={closeMenu}><small>06</small>Inteligência agrícola <b>↗</b></Link>
    <div className="public-menu-account"><Link href="/login" onClick={closeMenu}>INICIAR SESSÃO</Link><Link href="/signup" onClick={closeMenu}>CRIAR CONTA ↗</Link></div>
   </nav>
  </header>
  <section className="space-hero" id="plataforma" aria-label="Apresentação SpaceXplore Tchiowa">
   {slides.map((s,i)=><div key={s.eyebrow} className={"hero-image "+(i===activeSlide?"active":"")} style={{backgroundImage:'url("'+s.image+'")'}} aria-hidden="true"/>)}
   <div className="hero-shade"/><div className="hero-content">
    <div className="hero-kicker"><span className="hero-kicker-dot"/>{slides[activeSlide].eyebrow}<span className="hero-kicker-line"/></div>
    <div className="hero-title" key={activeSlide}><h1>{slides[activeSlide].title}</h1><p>{slides[activeSlide].copy}</p></div>
    <div className="hero-actions"><a className="hero-primary" href="#capacidades">EXPLORAR A PLATAFORMA <span>↗</span></a><Link className="hero-secondary" href="/signup">CRIAR A MINHA CONTA</Link></div>
    <div className="hero-bottom"><span>SPACE-BASED INSIGHT · EARTH-FOCUSED IMPACT</span><div className="hero-dots">{slides.map((s,i)=><button key={s.eyebrow} type="button" className={i===activeSlide?"active":""} aria-label={"Mostrar imagem "+(i+1)} aria-pressed={i===activeSlide} onClick={()=>setActiveSlide(i)}/>)}</div><span>0{activeSlide+1} / 0{slides.length}</span></div>
   </div><div className="hero-side-note">OBSERVAR · COMPREENDER · CULTIVAR</div>
  </section>
  <section className="public-intro" id="capacidades"><div className="intro-label"><span>01 / A NOSSA VISÃO</span><span>CIÊNCIA APLICADA À AGRICULTURA</span></div><div className="intro-grid"><h2>Dados que revelam.<br/><em>Conhecimento que orienta.</em></h2><p>O SpaceXplore Tchiowa é uma plataforma de inteligência agrícola que aproxima dados ambientais, observação da Terra e informação de campo. O nosso propósito é tornar informação complexa mais acessível, organizada e útil para compreender os contextos agrícolas e apoiar decisões fundamentadas.</p></div></section>
  <section className="capability-section"><div className="capability-heading"><span>02 / CAPACIDADES</span><p>Uma visão integrada do território, dos dados e da atividade agrícola.</p></div><div className="capability-grid">
   <article className="capability-card"><span className="capability-number">01</span><div className="capability-icon">◎</div><h3>Inteligência ambiental</h3><p>Explore indicadores climáticos e ambientais, conhecendo a origem, o período e o contexto de cada conjunto de dados.</p><span className="capability-tag">DADOS · AMBIENTE</span></article>
   <article className="capability-card"><span className="capability-number">02</span><div className="capability-icon">⌂</div><h3>Gestão agrícola</h3><p>Organize propriedades, caracterize áreas de produção e mantenha a informação agrícola estruturada num só espaço.</p><span className="capability-tag">PROPRIEDADES · CULTURAS</span></article>
   <article className="capability-card"><span className="capability-number">03</span><div className="capability-icon">⌁</div><h3>Monitorização</h3><p>Registe acontecimentos e observações de campo para construir um histórico agrícola rastreável.</p><span className="capability-tag">REGISTOS · ACOMPANHAMENTO</span></article>
   <article className="capability-card"><span className="capability-number">04</span><div className="capability-icon">⌗</div><h3>Análise e conhecimento</h3><p>Consulte indicadores e análises com distinção clara entre observações, cálculos, estimativas e informação em falta.</p><span className="capability-tag">ANÁLISE · EVIDÊNCIA</span></article>
  </div></section>
  <section className="science-band"><div><span>03 / COMPROMISSO CIENTÍFICO</span><h2>Conhecimento com origem.<br/><em>Resultados com contexto.</em></h2></div><p>A confiança começa pela transparência. Identificamos fontes, períodos, unidades e limitações dos dados. Informação regional não é apresentada como medição de campo, e análises não substituem observações ou validação agronómica.</p><a href="#clima">CONSULTAR DADOS CLIMÁTICOS ↗</a></section>
  <section className="climate-section" id="clima"><div className="climate-heading"><div><span className="public-section-label">04 / EXPLORAÇÃO DE DADOS</span><h2>Explorador climático</h2><p>Consulte indicadores diários disponibilizados pelo NASA POWER para um ponto geográfico e período selecionados.</p></div><span className="data-source-badge">NASA POWER · DAILY</span></div>
   <div className="climate-form"><label>LATITUDE<input value={latitude} onChange={e=>setLatitude(e.target.value)} inputMode="decimal"/></label><label>LONGITUDE<input value={longitude} onChange={e=>setLongitude(e.target.value)} inputMode="decimal"/></label><label>DATA INICIAL<input value={start} onChange={e=>setStart(e.target.value)} inputMode="numeric"/></label><label>DATA FINAL<input value={end} onChange={e=>setEnd(e.target.value)} inputMode="numeric"/></label><button onClick={loadClimate} disabled={loading}>{loading?"A CARREGAR DADOS…":"CONSULTAR DADOS ↗"}</button></div>
   {farmName&&<p className="climate-context">Consulta associada à propriedade: <strong>{farmName}</strong>.</p>}{result?.error&&<div className="climate-error" role="alert">{result.error}</div>}
   {observations&&<div className="climate-results"><div className="climate-results-head"><h3>Indicadores ambientais</h3><span>FONTE · NASA POWER</span></div><div className="climate-metrics">{Object.entries(observations).map(([key,values])=>{const fill=result.fillValue??-999,entries=Object.values(values).filter(v=>Number.isFinite(v)&&v!==fill&&v>-900),average=entries.length?entries.reduce((sum,v)=>sum+v,0)/entries.length:null;return <article className="climate-metric" key={key}><span>{LABELS[key]??metadata[key]?.longname??key}</span><strong>{average===null?"—":average.toFixed(1)}<small> {metadata[key]?.units??""}</small></strong><small>{entries.length.toLocaleString()} valores diários válidos</small></article>})}</div><p className="climate-provenance">Coordenadas: {result.location?.latitude}, {result.location?.longitude} · Período: {result.requestedPeriod?.start}–{result.requestedPeriod?.end} · Fuso: {result.timeStandard}</p><p className="climate-provenance">Obtido em: {result.retrievedAt?new Date(result.retrievedAt).toLocaleString():"—"}. Os valores apresentados são médias aritméticas das observações diárias válidas. Para precipitação, trata-se da média diária, não do acumulado.</p></div>}
   <p className="climate-disclaimer">Nota científica: o NASA POWER disponibiliza dados ambientais em grelha para contexto regional, não medições diretas nos limites de uma propriedade. Dados históricos não constituem previsões. O pH, a textura e os nutrientes do solo exigem medições ou fontes validadas específicas.</p>
  </section>
  <section className="account-cta"><div><span>05 / COMEÇAR</span><h2>O próximo passo<br/><em>começa com conhecimento.</em></h2><p>Crie a sua conta, organize as suas propriedades e comece a estruturar a informação da sua atividade agrícola.</p></div><div className="account-cta-actions"><Link href="/signup">CRIAR A MINHA CONTA ↗</Link><Link href="/login">JÁ TENHO UMA CONTA — INICIAR SESSÃO</Link></div></section>
  <footer className="public-footer">
   <div className="footer-orbit" aria-hidden="true"><span></span></div>
   <div className="footer-main">
    <div className="footer-brand">
     <Link className="public-brand" href="/" aria-label="SpaceXplore Tchiowa — início"><span className="public-brand-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="17.5" stroke="currentColor" strokeWidth="1"/><ellipse cx="24" cy="24" rx="22" ry="8.5" transform="rotate(-34 24 24)" stroke="currentColor" strokeWidth="1"/><circle cx="35.5" cy="12.2" r="2.3" fill="#b8e4ff"/><path d="M18 29.5 28.5 18M18 18h10.5v11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="public-brand-name">SPACEXPLORE <b>TCHIOWA</b><small>AGRICULTURAL INTELLIGENCE</small></span></Link>
     <p className="footer-manifesto">A Terra em perspectiva.<br/>A agricultura com mais contexto.</p>
     <p>Ciência, observação da Terra e tecnologia reunidas para tornar a informação agrícola mais clara, estruturada e útil.</p>
     <span className="footer-domain-note">EARTH OBSERVATION&nbsp; / &nbsp;AGRICULTURAL INTELLIGENCE</span>
    </div>
    <div className="footer-links"><span>EXPLORAR</span><a href="#plataforma">A plataforma <b>↗</b></a><a href="#capacidades">Capacidades <b>↗</b></a><a href="#clima">Explorador climático <b>↗</b></a></div>
    <div className="footer-links"><span>ESPAÇO DE TRABALHO</span><Link href="/farms">Propriedades agrícolas</Link><Link href="/monitoring">Monitorização</Link><Link href="/insights">Inteligência agrícola</Link></div>
    <div className="footer-links"><span>ACESSO</span><Link href="/login">Iniciar sessão</Link><Link href="/signup">Criar conta</Link><a href="#plataforma">Voltar ao início ↑</a></div>
    <div className="footer-credit"><span>UMA PLATAFORMA DESENVOLVIDA POR</span><strong>JPM <i>Tech Solutions</i></strong><p>Arquitetura tecnológica, engenharia de software e inovação aplicada.</p><span className="footer-credit-stamp">TECHNOLOGY · DATA · ENGINEERING</span></div>
   </div>
   <div className="footer-bottom"><span>© {new Date().getFullYear()} SPACEXPLORE TCHIOWA</span><span>CIÊNCIA · DADOS · AGRICULTURA</span><span>DESENVOLVIDO POR <b>JPM TECH SOLUTIONS</b></span></div>
  </footer>
 </main>;
}
