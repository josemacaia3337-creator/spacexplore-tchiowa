"use client";

import { useState } from "react";

type ClimateResult = {
  source?: string;
  retrievedAt?: string;
  location?: { latitude: number; longitude: number };
  requestedPeriod?: { start: string; end: string };
  data?: {
    properties?: {
      parameter?: Record<string, Record<string, number>>;
      parameter_units?: Record<string, string>;
    };
  };
  error?: string;
};

const LABELS: Record<string, string> = {
  T2M: "Average temperature",
  T2M_MAX: "Maximum temperature",
  T2M_MIN: "Minimum temperature",
  PRECTOTCORR: "Precipitation",
  RH2M: "Relative humidity"
};

export default function Home() {
  const [latitude, setLatitude] = useState("-5.55");
  const [longitude, setLongitude] = useState("12.19");
  const [start, setStart] = useState("20250101");
  const [end, setEnd] = useState("20251231");
  const [result, setResult] = useState<ClimateResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadClimate() {
    setLoading(true);
    setResult(null);
    try {
      const query = new URLSearchParams({ latitude, longitude, start, end });
      const response = await fetch(`/api/climate?${query.toString()}`);
      const payload = await response.json();
      setResult(payload);
    } catch {
      setResult({ error: "Unable to load climate data. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  const parameters = result?.data?.properties?.parameter;
  const units = result?.data?.properties?.parameter_units ?? {};

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="SpaceXplore Tchiowa home">
          <span className="brand-mark">S</span>
          <span>SPACEXPLORE <b>TCHIOWA</b></span>
        </a>
        <span className="top-label">NASA SPACE APPS · 2026</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="pulse" /> AGRICULTURAL INTELLIGENCE</div>
        <h1>Make every field<br /><em>more resilient.</em></h1>
        <p className="hero-copy">Explore environmental data and discover more informed ways to plan your farm’s future.</p>
        <div className="hero-meta"><span>01 / CLIMATE INTELLIGENCE</span><span>CABINDA, ANGOLA · DEMO REGION</span></div>
      </section>

      <section className="workspace">
        <div className="section-heading">
          <div><span className="eyebrow">NASA EARTH DATA</span><h2>Climate explorer</h2></div>
          <span className="status-tag">LIVE DATA CONNECTION</span>
        </div>
        <p className="section-copy">Retrieve daily climate indicators for a geographic point. The default coordinates are an illustrative Cabinda-area demo location, not a surveyed farm boundary.</p>

        <div className="query-panel">
          <label>LATITUDE<input value={latitude} onChange={(e) => setLatitude(e.target.value)} inputMode="decimal" /></label>
          <label>LONGITUDE<input value={longitude} onChange={(e) => setLongitude(e.target.value)} inputMode="decimal" /></label>
          <label>START DATE <small>YYYYMMDD</small><input value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label>END DATE <small>YYYYMMDD</small><input value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          <button onClick={loadClimate} disabled={loading}>{loading ? "LOADING NASA DATA…" : "LOAD CLIMATE DATA ↗"}</button>
        </div>

        {result?.error && <div className="notice error">{result.error}</div>}
        {parameters && (
          <div className="results">
            <div className="result-head"><div><span className="eyebrow">DATA RETRIEVED</span><h3>Environmental indicators</h3></div><span className="source-pill">SOURCE · NASA POWER</span></div>
            <div className="metric-grid">
              {Object.entries(parameters).map(([key, values]) => {
                const entries = Object.values(values).filter((value) => Number.isFinite(value) && value > -900);
                const average = entries.length ? entries.reduce((sum, value) => sum + value, 0) / entries.length : null;
                return <article className="metric" key={key}>
                  <span>{LABELS[key] ?? key}</span>
                  <strong>{average === null ? "—" : average.toFixed(1)}<small> {units[key] ?? ""}</small></strong>
                  <small>{entries.length.toLocaleString()} daily values</small>
                </article>;
              })}
            </div>
            <p className="provenance">Coordinates: {result.location?.latitude}, {result.location?.longitude} · Period: {result.requestedPeriod?.start}–{result.requestedPeriod?.end}</p>
            <p className="provenance">Retrieved: {result.retrievedAt ? new Date(result.retrievedAt).toLocaleString() : "—"}. Daily values are summarized here as simple arithmetic means; precipitation is shown as mean daily precipitation, not total rainfall.</p>
          </div>
        )}

        <div className="notice">Scientific note: gridded climate data provides regional context and is not a direct measurement at the farm boundary. Historical observations are not a forecast. Soil pH, texture, and nutrients require separate measurements or validated sources.</div>
      </section>

      <footer><span>SPACEXPLORE TCHIOWA</span><span>DATA-LED · EXPLAINABLE · FARM-FOCUSED</span></footer>
    </main>
  );
}
