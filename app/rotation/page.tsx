"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildRotationSequences } from "@/lib/rotation-engine";

type Farm = {
  id: string;
  name: string;
  currentCrop: string;
  soilTexture: string;
  soilPh: number | null;
  drainage: string;
};

const FARM_KEY = "spacexplore-tchiowa-farms-v1";

export default function RotationPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [ready, setReady] = useState(false);
  const sequences = useMemo(() => buildRotationSequences(3), []);
  const selectedFarm = farms.find((farm) => farm.id === farmId);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FARM_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Farm[];
        setFarms(parsed);
        if (parsed.length) setFarmId(parsed[0].id);
      }
    } catch {
      setFarms([]);
    } finally {
      setReady(true);
    }
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
        <nav className="top-nav"><Link href="/farms">GESTÃO DE EXPLORAÇÕES ↗</Link><Link href="/crops">INTELIGÊNCIA DE CULTURAS ↗</Link></nav>
      </header>
      <section className="farm-hero">
        <span className="eyebrow">04 / INTELIGÊNCIA DE ROTAÇÃO</span>
        <h1>Planeie para além<br /><em>de uma colheita.</em></h1>
        <p className="hero-copy">Explore padrões transparentes de sequência de culturas. Este protótipo explica as mudanças de famílias botânicas; ainda não prevê produtividade, rentabilidade ou adequação à exploração.</p>
      </section>
      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">CONTEXTO DA EXPLORAÇÃO</span><h2>Selecione uma exploração</h2></div><span className="status-tag">PRÉ-VISUALIZAÇÃO BASEADA EM REGRAS</span></div>
        {!ready ? <p className="section-copy">A carregar perfis das explorações…</p> : farms.length ? (
          <>
            <label className="rotation-farm-select">EXPLORAÇÃO<select value={farmId} onChange={(event) => setFarmId(event.target.value)}>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label>
            {selectedFarm && <div className="rotation-context"><strong>{selectedFarm.name}</strong><span>Cultura atual: {selectedFarm.currentCrop || "Não informado"}</span><span>Solo: {selectedFarm.soilTexture || "Não informado"}</span><span>pH: {selectedFarm.soilPh ?? "Não medido"}</span><span>Drenagem: {selectedFarm.drainage || "Não informado"}</span><p>Estes campos são apresentados apenas como contexto. O protótipo atual não os utiliza para classificar ou aprovar sequências de culturas.</p></div>}
          </>
        ) : <div className="empty-state"><strong>Não foi encontrado um perfil de exploração.</strong><p>Registe primeiro uma exploração. Os dados da exploração são guardados apenas neste navegador.</p><Link href="/farms">OPEN GESTÃO DE EXPLORAÇÕES ↗</Link></div>}
      </section>
      <section className="farm-list-section">
        <div className="section-heading"><div><span className="eyebrow">EXPLORADOR DE SEQUÊNCIAS</span><h2>Padrões de três culturas</h2></div><span className="status-tag">{sequences.length} GERADOS</span></div>
        <p className="section-copy">As sequências são geradas a partir das culturas classificadas como ciclo curto no catálogo inicial. Cada cultura aparece no máximo uma vez por sequência. A batata-doce é incluída por ser frequentemente gerida como cultura de ciclo curto, enquanto a mandioca e a banana permanecem classificadas como plantações de longo prazo.</p>
        <div className="rotation-grid">{sequences.map((sequence, index) => <article className="rotation-card" key={sequence.crops.map((crop) => crop.id).join("-")}>
          <div className="farm-card-top"><span className="eyebrow">PATTERN {String(index + 1).padStart(2, "0")}</span><span className={sequence.repeatedAdjacentFamily ? "rotation-flag" : "rotation-positive"}>{sequence.repeatedAdjacentFamily ? "FAMILY REPEAT" : "FAMILY CHANGE"}</span></div>
          <div className="rotation-flow">{sequence.crops.map((crop, cropIndex) => <div className="rotation-step" key={crop.id}><span>SEASON {cropIndex + 1}</span><strong>{crop.name}</strong><small>{crop.family}</small></div>)}</div>
          <p className="rotation-explanation">{sequence.explanation.join(" ")}</p>
        </article>)}</div>
      </section>
      <section className="notice"><strong>Limitação científica importante:</strong> estes são padrões ilustrativos de sequência, não recomendações de plantio. A mudança de família botânica, por si só, não comprova compatibilidade entre culturas nem a quebra de ciclos específicos de pragas e doenças. Antes de recomendar sequências no campo, o motor necessita de calendários locais verificados, dados de variedades e duração dos ciclos, limitações do solo, necessidades de chuva e água, histórico de pragas e doenças e referências agronómicas. Não são geradas estimativas de produtividade ou lucro.</section>
      <footer><span>SPACEXPLORE TCHIOWA</span><span>REGRAS TRANSPARENTES · SEM PONTUAÇÕES NÃO COMPROVADAS</span></footer>
    </main>
  );
}
