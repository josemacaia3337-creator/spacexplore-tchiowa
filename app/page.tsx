"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClimateResult = {
  source?: string;
  retrievedAt?: string;
  timeStandard?: string;
  fillValue?: number;
  location?: { latitude: number; longitude: number };
  requestedPeriod?: { start: string; end: string };
  parameters?: Record<string, { units?: string; longname?: string }>;
  data?: {
    properties?: {
      parameter?: Record<string, Record<string, number>>;
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
  const [farmName, setFarmName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const farm = params.get("farm");
    const lat = params.get("latitude");
    const lon = params.get("longitude");
    if (farm) setFarmName(farm);
    if (lat && Number.isFinite(Number(lat)) && Number(lat) >= -90 && Number(lat) <= 90) setLatitude(lat);
    if (lon && Number.isFinite(Number(lon)) && Number(lon) >= -180 && Number(lon) <= 180) setLongitude(lon);
  }, []);

  async function loadClimate() {
    setLoading(true);
    setResult(null);
    try {
      const query = new URLSearchParams({ latitude, longitude, start, end });
      const response = await fetch(`/api/climate?${query.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        setResult({ error: payload.error ?? `Request failed (HTTP ${response.status}).` });
      } else {
        setResult(payload);
      }
    } catch {
      setResult({ error: "Unable to load climate data. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  const observations = result?.data?.properties?.parameter;
  const metadata = result?.parameters ?? {};

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="SpaceXplore Tchiowa home">
          <span className="brand-mark">S</span>
          <span>SPACEXPLORE <b>TCHIOWA</b></span>
        </a>
        <nav className="top-nav"><Link href="/farms">FARM MANAGEMENT ↗</Link><Link href="/crops">CROP INTELLIGENCE ↗</Link><Link href="/insights">AGRICULTURAL INTELLIGENCE ↗</Link><Link href="/login">SIGN IN ↗</Link><Link href="/signup">CREATE ACCOUNT ↗</Link><span className="top-label">NASA SPACE APPS · 2026</span></nav>
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
          <span className="status-tag">NASA POWER · DAILY</span>
        </div>
        <p className="section-copy">{farmName ? `Climate lookup for ${farmName}. Coordinates were loaded from its farm profile.` : "Retrieve daily climate indicators for a geographic point. The default coordinates are an illustrative Cabinda-area demo location, not a surveyed farm boundary."}</p>

        <div className="query-panel">
          <label>LATITUDE<input value={latitude} onChange={(e) => setLatitude(e.target.value)} inputMode="decimal" /></label>
          <label>LONGITUDE<input value={longitude} onChange={(e) => setLongitude(e.target.value)} inputMode="decimal" /></label>
          <label>START DATE <small>YYYYMMDD</small><input value={start} onChange={(e) => setStart(e.target.value)} inputMode="numeric" /></label>
          <label>END DATE <small>YYYYMMDD</small><input value={end} onChange={(e) => setEnd(e.target.value)} inputMode="numeric" /></label>
          <button onClick={loadClimate} disabled={loading}>{loading ? "LOADING NASA DATA…" : "LOAD CLIMATE DATA ↗"}</button>
        </div>

        {result?.error && <div className="notice error" role="alert">{result.error}</div>}
        {observations && (
          <div className="results">
            <div className="result-head"><div><span className="eyebrow">DATA RETRIEVED</span><h3>Environmental indicators</h3></div><span className="source-pill">SOURCE · NASA POWER</span></div>
            <div className="metric-grid">
              {Object.entries(observations).map(([key, values]) => {
                const fill = result.fillValue ?? -999;
                const entries = Object.values(values).filter((value) => Number.isFinite(value) && value !== fill && value > -900);
                const average = entries.length ? entries.reduce((sum, value) => sum + value, 0) / entries.length : null;
                const unit = metadata[key]?.units ?? "";
                return <article className="metric" key={key}>
                  <span>{LABELS[key] ?? metadata[key]?.longname ?? key}</span>
                  <strong>{average === null ? "—" : average.toFixed(1)}<small> {unit}</small></strong>
                  <small>{entries.length.toLocaleString()} valid daily values</small>
                </article>;
              })}
            </div>
            <p className="provenance">Coordinates: {result.location?.latitude}, {result.location?.longitude} · Period: {result.requestedPeriod?.start}–{result.requestedPeriod?.end} · Time standard: {result.timeStandard}</p>
            <p className="provenance">Retrieved: {result.retrievedAt ? new Date(result.retrievedAt).toLocaleString() : "—"}. Values are arithmetic means across valid daily observations. For precipitation, this is mean daily precipitation, not accumulated rainfall.</p>
          </div>
        )}

        <div className="notice">Scientific note: NASA POWER provides gridded environmental data for regional context, not direct measurements at a farm boundary. Historical data is not a forecast. Soil pH, texture, and nutrients require separate measurements or validated sources.</div>
      </section>

      <footer><span>SPACEXPLORE TCHIOWA</span><span>DATA-LED · EXPLAINABLE · FARM-FOCUSED</span></footer>
    </main>
  );
}
