"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cropProfiles } from "@/lib/crops";

export default function CropsPage() {
  const [search, setSearch] = useState("");
  const [cycle, setCycle] = useState("Todas");
  const filtered = useMemo(() => cropProfiles.filter((crop) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || [crop.name, crop.scientificName, crop.family, crop.role].some((value) => value.toLowerCase().includes(term));
    return matchesText && (cycle === "Todas" || crop.fieldManagementCycle === cycle);
  }), [search, cycle]);

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
        <nav className="top-nav"><Link href="/farms">GESTÃO DE EXPLORAÇÕES ↗</Link><Link href="/">EXPLORADOR CLIMÁTICO ↗</Link><Link href="/rotation">MOTOR DE ROTAÇÃO ↗</Link></nav><Link className="analytics-settings-link" href="/dashboard#account-settings" aria-label="Configurações" title="Configurações">⚙</Link>
      </header>
      <section className="farm-hero">
        <span className="eyebrow">03 / INTELIGÊNCIA DE CULTURAS</span>
        <h1>Conheça<br /><em>cada cultura.</em></h1>
        <p className="hero-copy">Um catálogo inicial de culturas relevantes para a produção alimentar em Angola. As famílias botânicas ajudam a compreender relações entre culturas, mas não determinam, por si só, a adequação de uma cultura a uma exploração específica.</p>
      </section>
      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">CATÁLOGO INICIAL</span><h2>Perfis de culturas</h2></div><span className="status-tag">{filtered.length} / {cropProfiles.length} CULTURAS</span></div>
        <p className="section-copy">Este catálogo regista a identificação das culturas e os cuidados de planeamento. Não atribui pontuações não comprovadas de produtividade, rentabilidade, consumo de água ou calendário de plantio.</p>
        <div className="crop-controls">
          <label>PESQUISAR<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cultura, nome científico, família…" /></label>
          <label>CICLO DA CULTURA<select value={cycle} onChange={(e) => setCycle(e.target.value)}><option>Todas</option><option>Ciclo curto</option><option>Plantação de longo prazo</option></select></label>
        </div>
        <div className="crop-grid">
          {filtered.map((crop) => <article className="crop-card" key={crop.id}>
            <div className="crop-card-top"><span className="eyebrow">{crop.family}</span><span className="crop-type">{crop.fieldManagementCycle}</span></div>
            <h3>{crop.name}</h3><p className="crop-scientific">{crop.scientificName}</p>
            <p className="crop-role">{crop.role}</p><p className="crop-scientific">Biological lifecycle: {crop.biologicalLifecycle}</p>
            <div className="crop-note"><strong>CONTEXTO DE ROTAÇÃO</strong><p>{crop.rotationNote}</p></div>
            <div className="crop-note"><strong>VALIDAÇÃO LOCAL</strong><p>{crop.localValidation}</p></div>
          </article>)}
        </div>
        {filtered.length === 0 && <div className="empty-state">Nenhuma cultura corresponde à pesquisa. Experimente outro nome ou família.</div>}
      </section>
      <section className="notice">Nota de utilização científica: este é um catálogo preliminar, não uma recomendação agronómica validada localmente. Antes de classificar sequências de culturas, o motor de rotação deverá integrar fontes agronómicas regionais rastreáveis e validar calendários, características das variedades, limitações do solo, riscos de pragas e doenças e necessidades hídricas da região.</section>
      <footer><span>SPACEXPLORE TCHIOWA</span><span>PERFIS DE CULTURAS · EVIDÊNCIA EM PRIMEIRO LUGAR</span></footer>
    </main>
  );
}
