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
        <nav className="top-nav"><Link href="/farms">FARM MANAGEMENT ↗</Link><Link href="/crops">CROP INTELLIGENCE ↗</Link></nav>
      </header>
      <section className="farm-hero">
        <span className="eyebrow">04 / ROTATION INTELLIGENCE</span>
        <h1>Plan beyond<br /><em>one harvest.</em></h1>
        <p className="hero-copy">Explore transparent crop-sequence patterns. This prototype explains botanical-family changes; it does not yet predict yield, profitability or farm suitability.</p>
      </section>
      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">FARM CONTEXT</span><h2>Select a property</h2></div><span className="status-tag">RULE-BASED PREVIEW</span></div>
        {!ready ? <p className="section-copy">Loading local farm profiles…</p> : farms.length ? (
          <>
            <label className="rotation-farm-select">PROPERTY<select value={farmId} onChange={(event) => setFarmId(event.target.value)}>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label>
            {selectedFarm && <div className="rotation-context"><strong>{selectedFarm.name}</strong><span>Current crop: {selectedFarm.currentCrop || "Not provided"}</span><span>Soil: {selectedFarm.soilTexture || "Not provided"}</span><span>pH: {selectedFarm.soilPh ?? "Not measured"}</span><span>Drainage: {selectedFarm.drainage || "Not provided"}</span><p>These fields are displayed as context only. The current prototype does not use them to rank or approve crop sequences.</p></div>}
          </>
        ) : <div className="empty-state"><strong>No local farm profile found.</strong><p>Register a property first. Farm data is stored in this browser only.</p><Link href="/farms">OPEN FARM MANAGEMENT ↗</Link></div>}
      </section>
      <section className="farm-list-section">
        <div className="section-heading"><div><span className="eyebrow">SEQUENCE EXPLORER</span><h2>Three-crop patterns</h2></div><span className="status-tag">{sequences.length} GENERATED</span></div>
        <p className="section-copy">Sequences are generated from the annual crops currently in the starter catalogue. Each crop appears at most once per sequence. Perennial systems such as cassava and banana are excluded from this short-cycle preview.</p>
        <div className="rotation-grid">{sequences.map((sequence, index) => <article className="rotation-card" key={sequence.crops.map((crop) => crop.id).join("-")}>
          <div className="farm-card-top"><span className="eyebrow">PATTERN {String(index + 1).padStart(2, "0")}</span><span className={sequence.repeatedAdjacentFamily ? "rotation-flag" : "rotation-positive"}>{sequence.repeatedAdjacentFamily ? "FAMILY REPEAT" : "FAMILY CHANGE"}</span></div>
          <div className="rotation-flow">{sequence.crops.map((crop, cropIndex) => <div className="rotation-step" key={crop.id}><span>SEASON {cropIndex + 1}</span><strong>{crop.name}</strong><small>{crop.family}</small></div>)}</div>
          <p className="rotation-explanation">{sequence.explanation.join(" ")}</p>
        </article>)}</div>
      </section>
      <section className="notice"><strong>Important scientific limitation:</strong> these are illustrative sequence patterns, not planting recommendations. Botanical-family changes alone do not establish crop compatibility or break specific pest and disease cycles. Before field recommendations, the engine needs locally verified planting calendars, cultivar and duration data, soil constraints, rainfall and water requirements, pest and disease history, and agronomic references. No yield or profit estimates are generated.</section>
      <footer><span>SPACEXPLORE TCHIOWA</span><span>TRANSPARENT RULES · NO UNSUPPORTED SCORES</span></footer>
    </main>
  );
}
