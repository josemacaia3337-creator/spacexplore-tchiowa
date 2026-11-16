"use client";
import { useEffect, useState } from "react";

function isCalendarDate(value: string) {
 if (value.length !== 10 || value[4] !== "-" || value[7] !== "-") return false;
 const [year,month,day]=value.split("-").map(Number);
 const date=new Date(Date.UTC(year,month-1,day));
 return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}
import Link from "next/link";
import Image from "next/image";

const slides = [
 {image:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop",eyebrow:"OBSERVAÇÃO DA TERRA",title:"A Terra vista com precisão estratégica.",copy:"Monitorização orbital e leitura territorial para decisões baseadas em evidências."},
 {image:"https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop",eyebrow:"INTELIGÊNCIA CLIMÁTICA",title:"Interpretar o clima antes do impacto.",copy:"Dados meteorológicos, séries históricas e análise ambiental por localização e período."},
 {image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920&auto=format&fit=crop",eyebrow:"AGRICULTURA DE PRECISÃO",title:"Ciência aplicada ao campo e à colheita.",copy:"Diagnóstico do solo, saúde da vegetação e produtividade agrícola orientada por dados."},
 {image:"https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1920&auto=format&fit=crop",eyebrow:"MONITORIZAÇÃO AMBIENTAL",title:"Vigilância contínua dos recursos naturais.",copy:"Acompanhamento de bacias hídricas, uso da terra e indicadores ecológicos em tempo real."},
 {image:"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920&auto=format&fit=crop",eyebrow:"ENGENHARIA DE DADOS",title:"Dados complexos. Decisões claras.",copy:"Tecnologia geoespacial e análise integrada para transformar telemetria em inteligência acionável."}
];

export default function Home() {
 const [latitude,setLatitude]=useState("-5.55"),[longitude,setLongitude]=useState("12.19"),[start,setStart]=useState("20250101"),[end,setEnd]=useState("20251231");
 const [farmName,setFarmName]=useState(""),[formError,setFormError]=useState("");
 const [gpmLatitude,setGpmLatitude]=useState("-5.55"),[gpmLongitude,setGpmLongitude]=useState("12.19"),[gpmStart,setGpmStart]=useState(""),[gpmEnd,setGpmEnd]=useState(""),[gpmError,setGpmError]=useState("");
 const [menuOpen,setMenuOpen]=useState(false),[activeSlide,setActiveSlide]=useState(0);
 useEffect(()=>{const p=new URLSearchParams(window.location.search),farm=p.get("farm"),lat=p.get("latitude"),lon=p.get("longitude"),initialStart=p.get("start"),initialEnd=p.get("end"),gLat=p.get("gpmLatitude"),gLon=p.get("gpmLongitude"),gStart=p.get("gpmStart"),gEnd=p.get("gpmEnd");if(farm)setFarmName(farm);if(lat&&Number.isFinite(Number(lat))&&Number(lat)>=-90&&Number(lat)<=90)setLatitude(lat);if(lon&&Number.isFinite(Number(lon))&&Number(lon)>=-180&&Number(lon)<=180)setLongitude(lon);if(initialStart&&/^[0-9]{8}$/.test(initialStart))setStart(initialStart);if(initialEnd&&/^[0-9]{8}$/.test(initialEnd))setEnd(initialEnd);if(gLat&&Number.isFinite(Number(gLat))&&Number(gLat)>=-90&&Number(gLat)<=90)setGpmLatitude(gLat);if(gLon&&Number.isFinite(Number(gLon))&&Number(gLon)>=-180&&Number(gLon)<=180)setGpmLongitude(gLon);const yesterday=new Date();yesterday.setUTCDate(yesterday.getUTCDate()-1);const defaultEnd=yesterday.toISOString().slice(0,10);const defaultStartDate=new Date(yesterday);defaultStartDate.setUTCDate(defaultStartDate.getUTCDate()-6);setGpmStart(gStart&&isCalendarDate(gStart)?gStart:defaultStartDate.toISOString().slice(0,10));setGpmEnd(gEnd&&isCalendarDate(gEnd)?gEnd:defaultEnd)},[]);
 useEffect(()=>{slides.forEach((slide)=>{const image=new window.Image();image.src=slide.image})},[]);
 useEffect(()=>{
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(motion.matches)return;
  let timer:number|undefined;
  const stopRotation=()=>{if(timer){window.clearInterval(timer);timer=undefined}};
  const startRotation=()=>{if(document.visibilityState==="visible"&&!timer&&!motion.matches)timer=window.setInterval(()=>setActiveSlide(c=>(c+1)%slides.length),5000)};
  const onVisibilityChange=()=>document.visibilityState==="visible"?startRotation():stopRotation();
  const onMotionChange=()=>motion.matches?stopRotation():startRotation();
  document.addEventListener("visibilitychange",onVisibilityChange);
  motion.addEventListener("change",onMotionChange);
  startRotation();
  return()=>{stopRotation();document.removeEventListener("visibilitychange",onVisibilityChange);motion.removeEventListener("change",onMotionChange)};
 },[]);
 useEffect(()=>{
  if(!menuOpen)return;
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setMenuOpen(false)};
  const previous=document.body.style.overflow;
  document.body.style.overflow="hidden";
  window.addEventListener("keydown",onKeyDown);
  return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKeyDown)};
 },[menuOpen]);
 function requestClimate(){const lat=Number(latitude),lon=Number(longitude);if(!latitude.trim()||!longitude.trim()||!Number.isFinite(lat)||lat < -90||lat > 90||!Number.isFinite(lon)||lon < -180||lon > 180){setFormError("Indique coordenadas válidas: latitude entre -90 e 90 e longitude entre -180 e 180.");return}if(!/^[0-9]{8}$/.test(start)||!/^[0-9]{8}$/.test(end)||start>end){setFormError("Indique datas válidas no formato AAAAMMDD e confirme a ordem do período.");return}const query=new URLSearchParams({climate:"1",latitude:latitude.trim(),longitude:longitude.trim(),start:start.trim(),end:end.trim()});if(farmName)query.set("farm",farmName);window.location.assign("/dashboard?"+query.toString())}
 function requestGpm(){const lat=Number(gpmLatitude),lon=Number(gpmLongitude);if(!gpmLatitude.trim()||!gpmLongitude.trim()||!Number.isFinite(lat)||lat < -90||lat > 90||!Number.isFinite(lon)||lon < -180||lon > 180){setGpmError("Indique coordenadas válidas: latitude entre -90 e 90 e longitude entre -180 e 180.");return}if(!isCalendarDate(gpmStart)||!isCalendarDate(gpmEnd)||gpmStart>gpmEnd){setGpmError("Selecione datas válidas e confirme a ordem do período.");return}const today=new Date();today.setUTCHours(0,0,0,0);const first=new Date(gpmStart+"T00:00:00Z"),last=new Date(gpmEnd+"T00:00:00Z"),oldest=new Date(today);oldest.setUTCDate(oldest.getUTCDate()-59);if(first<oldest||last>today){setGpmError("O NASA GPM Publisher disponibiliza esta consulta diária numa janela móvel dos últimos 60 dias. Não selecione datas futuras.");return}if(Math.floor((last.getTime()-first.getTime())/86400000)+1>60){setGpmError("O período máximo desta consulta é de 60 dias.");return}const query=new URLSearchParams({gpm:"1",gpmLatitude:gpmLatitude.trim(),gpmLongitude:gpmLongitude.trim(),gpmStart,gpmEnd});if(farmName)query.set("gpmFarm",farmName);window.location.assign("/dashboard?"+query.toString())}
 const closeMenu=()=>setMenuOpen(false);
 return <main className="public-site">
  <header className="public-header">
   <Link className="public-brand" href="/" aria-label="SpaceXplore Tchiowa — página inicial"><Image src="/spacexplore-brand.svg" alt="SpaceXplore Tchiowa" width={230} height={54} className="brand-logo-image" priority/></Link>
   <div className="public-header-right"><Link className="analytics-settings-link" href="/dashboard#account-settings" aria-label="Configurações da conta" title="Configurações da conta">⚙</Link><button className={"menu-trigger "+(menuOpen?"is-open":"")} type="button" aria-label={menuOpen?"Fechar navegação":"Abrir navegação"} aria-expanded={menuOpen} aria-controls="public-menu" onClick={()=>setMenuOpen(!menuOpen)}><i aria-hidden="true"><b></b><b></b><b></b></i></button></div>
   {menuOpen&&<div className="public-menu-backdrop" onClick={closeMenu}/>}
   <nav id="public-menu" className={"public-menu "+(menuOpen?"is-open":"")} aria-label="Menu principal" aria-hidden={!menuOpen}>
    <div className="public-menu-heading"><span>NAVEGAR NA PLATAFORMA</span><span>01 — 07</span></div>
    <a href="#plataforma" onClick={closeMenu}><small>01</small>A plataforma <b>↗</b></a><a href="#capacidades" onClick={closeMenu}><small>02</small>Capacidades <b>↗</b></a><a href="#clima" onClick={closeMenu}><small>03</small>NASA POWER <b>↗</b></a><a href="#gpm" onClick={closeMenu}><small>04</small>NASA GPM <b>↗</b></a>
    <Link href="/farms" onClick={closeMenu}><small>05</small>Propriedades agrícolas <b>↗</b></Link><Link href="/monitoring" onClick={closeMenu}><small>06</small>Monitorização <b>↗</b></Link><Link href="/insights" onClick={closeMenu}><small>07</small>Inteligência agrícola <b>↗</b></Link>
    <div className="public-menu-account"><Link href="/login" onClick={closeMenu}>INICIAR SESSÃO</Link><Link href="/signup" onClick={closeMenu}>CRIAR CONTA ↗</Link></div>
   </nav>
  </header>
  <section className="space-hero" id="plataforma" aria-label="Apresentação SpaceXplore Tchiowa">
   <div className="hero-slides" aria-live="off">{slides.map((s,i)=><div key={s.eyebrow} className={"hero-slide "+(i===activeSlide?"active":"")} style={{backgroundImage:`linear-gradient(135deg,rgba(3,7,18,.18),rgba(3,7,18,.32)),url("${s.image}")`}} aria-hidden="true"/>)}</div>
   <div className="hero-shade"/><div className="hero-content">
    <div className="hero-kicker"><span className="hero-kicker-dot"/>{slides[activeSlide].eyebrow}<span className="hero-kicker-line"/></div>
    <div className="hero-title" key={activeSlide}><h1>{slides[activeSlide].title}</h1><p>{slides[activeSlide].copy}</p></div>
    <div className="hero-actions"><a className="hero-primary" href="#clima">EXPLORAR CONSULTOR CLIMÁTICO ↗</a><a className="hero-secondary" href="#capacidades">CONHECER A PLATAFORMA</a></div>

   </div>
  </section>
  <section className="climate-section" id="clima"><div className="climate-heading"><div><span className="public-section-label">04 / EXPLORAÇÃO DE DADOS</span><h2>Explorador climático</h2><p>Consulte indicadores diários disponibilizados pelo NASA POWER para um ponto geográfico e período selecionados.</p></div><span className="data-source-badge">NASA POWER · DAILY</span></div>
   <div className="climate-form"><label>LATITUDE<input value={latitude} onChange={e=>setLatitude(e.target.value)} inputMode="decimal"/></label><label>LONGITUDE<input value={longitude} onChange={e=>setLongitude(e.target.value)} inputMode="decimal"/></label><label>DATA INICIAL<input value={start} onChange={e=>setStart(e.target.value)} inputMode="numeric"/></label><label>DATA FINAL<input value={end} onChange={e=>setEnd(e.target.value)} inputMode="numeric"/></label><button type="button" onClick={requestClimate}>CONSULTAR DADOS ↗</button></div>
   {farmName&&<p className="climate-context">Consulta associada à propriedade: <strong>{farmName}</strong>.</p>}{formError&&<div className="climate-error" role="alert">{formError}</div>}
   <p className="climate-access-note">A consulta completa é realizada no espaço privado. Ao continuar, poderá criar uma conta ou iniciar sessão; a localização e o período selecionados serão preservados no seu dashboard.</p>
   <p className="climate-disclaimer">Nota científica: o NASA POWER disponibiliza dados ambientais em grelha para contexto regional, não medições diretas nos limites de uma propriedade. Dados históricos não constituem previsões. O pH, a textura e os nutrientes do solo exigem medições ou fontes validadas específicas.</p>
  </section>
  <section className="gpm-public-section" id="gpm"><div className="gpm-public-heading"><div><span className="public-section-label">05 / PRECIPITAÇÃO POR SATÉLITE</span><h2>NASA GPM · IMERG</h2><p>Explore estimativas diárias de precipitação acumulada por satélite para a região que inclui as coordenadas selecionadas.</p></div><span className="data-source-badge">NASA GPM · IMERG</span></div><div className="gpm-public-form"><label>LATITUDE<input value={gpmLatitude} onChange={e=>setGpmLatitude(e.target.value)} inputMode="decimal"/></label><label>LONGITUDE<input value={gpmLongitude} onChange={e=>setGpmLongitude(e.target.value)} inputMode="decimal"/></label><label>DATA INICIAL<input type="date" value={gpmStart} onChange={e=>setGpmStart(e.target.value)}/></label><label>DATA FINAL<input type="date" value={gpmEnd} onChange={e=>setGpmEnd(e.target.value)}/></label><button type="button" onClick={requestGpm}>CONSULTAR PRECIPITAÇÃO ↗</button></div>{gpmError&&<div className="climate-error" role="alert">{gpmError}</div>}<p className="gpm-public-note">Produto: IMERG Late Run · acumulação de 1 dia · unidade: mm · grelha de 0,1° (aproximadamente 10 km). O serviço público PMM Publisher disponibiliza esta coleção numa janela móvel de 60 dias; a atualização não é instantânea.</p><p className="gpm-public-note">A consulta completa abre no espaço privado. A localização e o período selecionados seguem consigo durante a criação de conta ou início de sessão.</p></section>
  <section className="public-intro" id="capacidades"><div className="intro-label"><span>01 / A NOSSA VISÃO</span><span>CIÊNCIA APLICADA À AGRICULTURA</span></div><div className="intro-grid"><h2>Dados que revelam.<br/><em>Conhecimento que orienta.</em></h2><p>O SpaceXplore Tchiowa é uma plataforma de inteligência agrícola que aproxima dados ambientais, observação da Terra e informação de campo. O nosso propósito é tornar informação complexa mais acessível, organizada e útil para compreender os contextos agrícolas e apoiar decisões fundamentadas.</p></div></section>
  <section className="capability-section"><div className="capability-heading"><span>02 / CAPACIDADES</span><p>Uma visão integrada do território, dos dados e da atividade agrícola.</p></div><div className="capability-grid">
   <article className="capability-card"><span className="capability-number">01</span><div className="capability-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="4"/><path d="M16 1v5M16 26v5M1 16h5M26 16h5"/></svg></div><h3>Inteligência ambiental</h3><p>Explore indicadores climáticos e ambientais, conhecendo a origem, o período e o contexto de cada conjunto de dados.</p><span className="capability-tag">DADOS · AMBIENTE</span></article>
   <article className="capability-card"><span className="capability-number">02</span><div className="capability-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="m3 15 13-11 13 11M7 13v15h18V13M13 28v-9h6v9"/></svg></div><h3>Gestão agrícola</h3><p>Organize propriedades, caracterize áreas de produção e mantenha a informação agrícola estruturada num só espaço.</p><span className="capability-tag">PROPRIEDADES · CULTURAS</span></article>
   <article className="capability-card"><span className="capability-number">03</span><div className="capability-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M3 24c5-15 9 8 14-5s8-11 12-9M3 29h26"/></svg></div><h3>Monitorização</h3><p>Registe acontecimentos e observações de campo para construir um histórico agrícola rastreável.</p><span className="capability-tag">REGISTOS · ACOMPANHAMENTO</span></article>
   <article className="capability-card"><span className="capability-number">04</span><div className="capability-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M11 3 8 29M24 3l-3 26M3 12h26M2 21h26"/></svg></div><h3>Análise e conhecimento</h3><p>Consulte indicadores e análises com distinção clara entre observações, cálculos, estimativas e informação em falta.</p><span className="capability-tag">ANÁLISE · EVIDÊNCIA</span></article>
  </div></section>
  <section className="science-band"><div><span>03 / COMPROMISSO CIENTÍFICO</span><h2>Conhecimento com origem.<br/><em>Resultados com contexto.</em></h2></div><p>A confiança começa pela transparência. Identificamos fontes, períodos, unidades e limitações dos dados. Informação regional não é apresentada como medição de campo, e análises não substituem observações ou validação agronómica.</p><a href="#clima">CONSULTAR CAMADAS NASA ↗</a></section>

  <section className="account-cta"><div><span>05 / COMEÇAR</span><h2>O próximo passo<br/><em>começa com conhecimento.</em></h2><p>Crie a sua conta, organize as suas propriedades e comece a estruturar a informação da sua atividade agrícola.</p></div><div className="account-cta-actions"><Link href="/signup">CRIAR A MINHA CONTA ↗</Link><Link href="/login">JÁ TENHO UMA CONTA — INICIAR SESSÃO</Link></div></section>
  <footer className="public-footer">
   <div className="footer-compact-top">
    <div className="footer-compact-brand"><Link className="public-brand" href="/" aria-label="SpaceXplore Tchiowa — início"><Image src="/spacexplore-brand.svg" alt="SpaceXplore Tchiowa" width={230} height={54} className="brand-logo-image" priority/></Link><span>Observação da Terra &amp; Inteligência Agrícola</span></div>
    <nav className="footer-compact-nav" aria-label="Navegação do rodapé"><a href="#plataforma">Plataforma</a><a href="#clima">NASA POWER</a><a href="#gpm">NASA GPM</a><Link href="/monitoring">Monitorização</Link><Link href="/login">Entrar</Link></nav>
   </div>
   <div className="footer-compact-bottom"><span>© 2026 SpaceXplore Tchiowa. Todos os direitos reservados.</span><span>Desenvolvido por <a href="https://www.jpmtechsolutions.com/" target="_blank" rel="noopener noreferrer">JPM Tech Solutions</a></span></div>
  </footer>
 </main>;
}
