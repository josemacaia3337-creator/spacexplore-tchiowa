"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { analyzeClimate, assessFarmReadiness } from "@/lib/climate-analysis";

type Farm = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  areaHa: number | null;
  soilTexture: string;
  soilPh: number | null;
  organicMatter: number | null;
  drainage: string;
  currentCrop: string;
};

type ClimateResponse = {
  fillValue?: number;
  parameters?: Record<string, { units?: string }>;
  data?: { properties?: { parameter?: Record<string, Record<string, number>> } };
  error?: string;
};

const FARM_KEY = "spacexplore-tchiowa-farms-v1";
const START = "20250101";
const END = "20251231";

export default function InsightsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [climate, setClimate] = useState<ClimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FARM_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Farm[];
        setFarms(parsed);
        if (parsed.length) setFarmId(parsed[0].id);
      }
    } catch {
      setError("Farm profiles could not be read from this browser.");
    }
  }, []);

  const farm = farms.find((item) => item.id === farmId);
  const readiness = useMemo(() => farm ? assessFarmReadiness(farm) : [], [farm]);
  const parameterData = climate?.data?.properties?.parameter;
  const metrics = useMemo(() => parameterData ? analyzeClimate({
    parameters: parameterData,
    fillValue: climate?.fillValue,
    start: START,
    end: END
  }) : [], [parameterData, climate?.fillValue]);

  async function loadAnalysis() {
    if (!farm) return;
    setLoading(true);
    setLoaded(false);
    setError("");
    setClimate(null);
    try {
      const query = new URLSearchParams({
        latitude: String(farm.latitude),
        longitude: String(farm.longitude),
        start: START,
        end: END
      });
      const response = await fetch(`/api/climate?${query.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Climate data request failed.");
      setClimate(payload);
      setLoaded(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load climate data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
        <nav className="top-nav"><Link href="/farms">FARM MANAGEMENT ↗</Link><Link href="/crops">CROP INTELLIGENCE ↗</Link><Link href="/rotation">ROTATION ENGINE ↗</Link></nav>
      </header>

      <section className="farm-hero">
        <span className="eyebrow">05 / AGRICULTURAL INTELLIGENCE</span>
        <h1>Understand<br /><em>the evidence.</em></h1>
        <p className="hero-copy">Bring climate observations and farm profile information together. See what is known, what is missing and what still requires field validation.</p>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">ANALYSIS SUBJECT</span><h2>Select a farm</h2></div><span className="status-tag">EVIDENCE-FIRST</span></div>
        {farms.length ? <>
          <label className="rotation-farm-select">REGISTERED PROPERTY
            <select value={farmId} onChange={(event) => { setFarmId(event.target.value); setClimate(null); setLoaded(false); }}>
              {farms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          {farm && <div className="rotation-context"><strong>{farm.name}</strong><span>Coordinates: {farm.latitude}, {farm.longitude}</span><span>Period: 2025 calendar year</span><p>NASA POWER provides gridded regional context, not measurements taken directly inside this farm.</p></div>}
          <button className="primary-button" onClick={loadAnalysis} disabled={!farm || loading}>{loading ? "ANALYSING CLIMATE DATA…" : "LOAD FARM INTELLIGENCE ↗"}</button>
        </> : <div className="empty-state"><strong>No farm profile available.</strong><p>Register a farm before requesting a combined analysis.</p><Link href="/farms">OPEN FARM MANAGEMENT ↗</Link></div>}
        {error && <div className="notice error" role="alert">{error}</div>}
      </section>

      {farm && <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">01 / PROFILE COMPLETENESS</span><h2>Farm data readiness</h2></div><span className="status-tag">{readiness.filter((item) => item.status === "provided").length} / {readiness.length} PROVIDED</span></div>
        <p className="section-copy">This is a completeness check, not a farm quality score. A missing value is not assumed or inferred from location.</p>
        <div className="readiness-grid">{readiness.map((item) => <article className="readiness-card" key={item.label}><div className="farm-card-top"><strong>{item.label}</strong><span className={item.status === "provided" ? "readiness-provided" : "readiness-missing"}>{item.status === "provided" ? "PROVIDED" : "MISSING"}</span></div><p>{item.detail}</p></article>)}</div>
      </section>}

      {loaded && <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">02 / ENVIRONMENTAL OBSERVATIONS</span><h2>Climate summary</h2></div><span className="status-tag">NASA POWER · DAILY</span></div>
        <p className="section-copy">Summary of valid daily values for 1 January–31 December 2025. Missing and fill values are excluded from calculations.</p>
        <div className="insight-metric-grid">{metrics.map((metric) => <article className="metric" key={metric.key}><span>{metric.label}</span><strong>{metric.key === "PRECTOTCORR" ? (metric.total === null ? "—" : metric.total.toFixed(1)) : (metric.mean === null ? "—" : metric.mean.toFixed(1))}<small> {metric.unit}</small></strong><small>{metric.validDays} / {metric.expectedDays} valid days · {metric.coveragePercent.toFixed(0)}% coverage</small><p>{metric.aggregation}</p></article>)}</div>
        <div className="notice">Interpretation boundary: these are descriptive statistics for the requested grid point and period. They do not establish irrigation need, drought status, crop suitability, disease risk or future weather. Those analyses require additional validated methods and local evidence.</div>
      </section>}

      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">03 / EVIDENCE STILL REQUIRED</span><h2>What we cannot infer yet</h2></div><span className="status-tag">VALIDATION NEEDED</span></div>
        <div className="evidence-list">
          <p><strong>Soil nutrients and fertility:</strong> require soil sampling or a trusted laboratory report.</p>
          <p><strong>Field water availability:</strong> requires irrigation records, water-source information or field measurements; rainfall grids alone do not describe farm water access.</p>
          <p><strong>Crop suitability:</strong> requires locally verified crop calendars, cultivar traits, soil constraints and crop-specific thresholds from reliable agronomic sources.</p>
          <p><strong>Pest and disease pressure:</strong> requires local field history and surveillance information.</p>
        </div>
      </section>

      <footer><span>SPACEXPLORE TCHIOWA</span><span>OBSERVATIONS ≠ RECOMMENDATIONS</span></footer>
    </main>
  );
}
