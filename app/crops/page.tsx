"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cropProfiles } from "@/lib/crops";

export default function CropsPage() {
  const [search, setSearch] = useState("");
  const [cycle, setCycle] = useState("All");
  const filtered = useMemo(() => cropProfiles.filter((crop) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || [crop.name, crop.scientificName, crop.family, crop.role].some((value) => value.toLowerCase().includes(term));
    return matchesText && (cycle === "All" || crop.fieldManagementCycle === cycle);
  }), [search, cycle]);

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
        <nav className="top-nav"><Link href="/farms">FARM MANAGEMENT ↗</Link><Link href="/">CLIMATE EXPLORER ↗</Link><Link href="/rotation">ROTATION ENGINE ↗</Link></nav>
      </header>
      <section className="farm-hero">
        <span className="eyebrow">03 / CROP INTELLIGENCE</span>
        <h1>Understand<br /><em>every crop.</em></h1>
        <p className="hero-copy">A starter catalogue of crops relevant to food production in Angola. Botanical families help describe crop relationships; they do not, by themselves, determine whether a crop is suitable for a specific farm.</p>
      </section>
      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">STARTER CATALOGUE</span><h2>Crop profiles</h2></div><span className="status-tag">{filtered.length} / {cropProfiles.length} CROPS</span></div>
        <p className="section-copy">This first catalogue records crop identity and planning cautions. It intentionally does not assign unsupported yield, profitability, water-demand or planting-calendar scores.</p>
        <div className="crop-controls">
          <label>SEARCH<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Crop, scientific name, family…" /></label>
          <label>FIELD CYCLE<select value={cycle} onChange={(e) => setCycle(e.target.value)}><option>All</option><option>Short-cycle</option><option>Long-term planting</option></select></label>
        </div>
        <div className="crop-grid">
          {filtered.map((crop) => <article className="crop-card" key={crop.id}>
            <div className="crop-card-top"><span className="eyebrow">{crop.family}</span><span className="crop-type">{crop.fieldManagementCycle}</span></div>
            <h3>{crop.name}</h3><p className="crop-scientific">{crop.scientificName}</p>
            <p className="crop-role">{crop.role}</p><p className="crop-scientific">Biological lifecycle: {crop.biologicalLifecycle}</p>
            <div className="crop-note"><strong>ROTATION CONTEXT</strong><p>{crop.rotationNote}</p></div>
            <div className="crop-note"><strong>LOCAL VALIDATION</strong><p>{crop.localValidation}</p></div>
          </article>)}
        </div>
        {filtered.length === 0 && <div className="empty-state">No crops match this search. Try another name or family.</div>}
      </section>
      <section className="notice">Scientific-use note: this is a preliminary product catalogue, not a locally validated agronomic recommendation. Before the rotation engine scores crop sequences, we must add traceable regional agronomy sources and validate crop calendars, cultivar traits, soil constraints, pest and disease risks and water requirements for the target area.</section>
      <footer><span>SPACEXPLORE TCHIOWA</span><span>CROP PROFILES · EVIDENCE FIRST</span></footer>
    </main>
  );
}
