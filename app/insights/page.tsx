"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { analyzeClimate, assessFarmReadiness } from "@/lib/climate-analysis";
import ClimateCharts from "./ClimateCharts";

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

type AgriculturalRecord = { id:string; record_type:string; title:string; description:string|null; occurred_at:string; crop:string|null; observation_status:string|null; input_name:string|null; input_quantity:number|null; input_unit:string|null; yield_quantity:number|null; yield_unit:string|null; source:string; };

type ClimateResponse = {
  fillValue?: number;
  parameters?: Record<string, { units?: string }>;
  data?: { properties?: { parameter?: Record<string, Record<string, number>> } };
  error?: string;
};

const DEFAULT_START = "2025-01-01";
const DEFAULT_END = "2025-12-31";
const toApiDate = (value: string) => value.replaceAll("-", "");
const expectedDays = (start: string, end: string) => Math.floor((new Date(end + "T00:00:00Z").getTime() - new Date(start + "T00:00:00Z").getTime()) / 86400000) + 1;
const previousYearDate = (value: string) => { const parts = value.split("-").map(Number); const year = parts[0] - 1; const month = parts[1]; const day = parts[2]; const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate(); return year + "-" + String(month).padStart(2,"0") + "-" + String(Math.min(day,lastDay)).padStart(2,"0"); };

export default function InsightsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [climate, setClimate] = useState<ClimateResponse | null>(null);
  const [comparisonClimate, setComparisonClimate] = useState<ClimateResponse | null>(null);
  const [records, setRecords] = useState<AgriculturalRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [periodStart, setPeriodStart] = useState(DEFAULT_START);
  const [periodEnd, setPeriodEnd] = useState(DEFAULT_END);

  useEffect(() => {
    let active = true;
    async function loadFarms() {
      try {
        const response = await fetch("/api/farms", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load farm profiles.");
        const parsed = (payload.farms ?? []).map((farm: {
          id: string; name: string; latitude: number; longitude: number;
          area_hectares: number | null; soil_texture: string | null; soil_ph: number | null;
          organic_matter_pct: number | null; drainage_class: string | null; current_crop: string | null;
        }) => ({
          id: farm.id, name: farm.name, latitude: farm.latitude, longitude: farm.longitude,
          areaHa: farm.area_hectares, soilTexture: farm.soil_texture ?? "",
          soilPh: farm.soil_ph, organicMatter: farm.organic_matter_pct,
          drainage: farm.drainage_class ?? "", currentCrop: farm.current_crop ?? ""
        })) as Farm[];
        if (!active) return;
        setFarms(parsed);
        if (parsed.length) setFarmId(parsed[0].id);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load farm profiles.");
      }
    }
    loadFarms();
    return () => { active = false; };
  }, []);

  const farm = farms.find((item) => item.id === farmId);

  useEffect(() => {
    if (!farmId) { setRecords([]); return; }
    let active = true;
    async function loadRecords() {
      setRecordsLoading(true); setRecordsError("");
      try {
        const response = await fetch(`/api/farms/${farmId}/records`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar o histórico.");
        if (active) setRecords(payload.records ?? []);
      } catch (caught) {
        if (active) setRecordsError(caught instanceof Error ? caught.message : "Erro ao carregar histórico.");
      } finally { if (active) setRecordsLoading(false); }
    }
    loadRecords();
    return () => { active = false; };
  }, [farmId]);
  const readiness = useMemo(() => farm ? assessFarmReadiness(farm) : [], [farm]);
  const parameterData = climate?.data?.properties?.parameter;
  const metrics = useMemo(() => parameterData ? analyzeClimate({
    parameters: parameterData, fillValue: climate?.fillValue,
    start: toApiDate(periodStart), end: toApiDate(periodEnd)
  }) : [], [parameterData, climate?.fillValue, periodStart, periodEnd]);
  const comparisonMetrics = useMemo(() => {
    const series = comparisonClimate?.data?.properties?.parameter;
    return series ? analyzeClimate({ parameters: series, fillValue: comparisonClimate?.fillValue,
      start: toApiDate(previousYearDate(periodStart)), end: toApiDate(previousYearDate(periodEnd)) }) : [];
  }, [comparisonClimate, periodStart, periodEnd]);

  async function loadAnalysis() {
    if (!farm) return;
    setLoading(true);
    setLoaded(false);
    setError("");
    setClimate(null);
    setComparisonClimate(null);
    const startDate = new Date(periodStart + "T00:00:00Z");
    const endDate = new Date(periodEnd + "T00:00:00Z");
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(periodStart) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(periodEnd) || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate.toISOString().slice(0,10) !== periodStart || endDate.toISOString().slice(0,10) !== periodEnd || startDate > endDate || endDate >= today) { setError("Indique um intervalo válido, com início anterior ao fim e data final anterior a hoje."); setLoading(false); return; }
    if (expectedDays(periodStart, periodEnd) > 3660) { setError("Selecione um período máximo de 10 anos para manter a consulta responsiva."); setLoading(false); return; }
    try {
      const query = new URLSearchParams({
        latitude: String(farm.latitude),
        longitude: String(farm.longitude),
        start: toApiDate(periodStart),
        end: toApiDate(periodEnd)
      });
      const comparisonStart = previousYearDate(periodStart);
      const comparisonEnd = previousYearDate(periodEnd);
      const comparisonQuery = new URLSearchParams({ latitude: String(farm.latitude), longitude: String(farm.longitude), start: toApiDate(comparisonStart), end: toApiDate(comparisonEnd) });
      const [response, comparisonResponse] = await Promise.all([fetch(`/api/climate?${query.toString()}`), fetch(`/api/climate?${comparisonQuery.toString()}`)]);
      const [payload, comparisonPayload] = await Promise.all([response.json(), comparisonResponse.json()]);
      if (!response.ok) throw new Error(payload.error ?? "Climate data request failed.");
      if (!comparisonResponse.ok) throw new Error(comparisonPayload.error ?? "Não foi possível carregar o período de comparação.");
      setClimate(payload);
      setComparisonClimate(comparisonPayload);
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
        <nav className="top-nav"><Link href="/farms">GESTÃO DE EXPLORAÇÕES ↗</Link><Link href="/crops">INTELIGÊNCIA DE CULTURAS ↗</Link><Link href="/rotation">MOTOR DE ROTAÇÃO ↗</Link><Link href="/monitoring">MONITORIZAÇÃO ↗</Link></nav>
      </header>

      <section className="farm-hero">
        <span className="eyebrow">05 / AGRICULTURAL INTELLIGENCE</span>
        <h1>Understand<br /><em>the evidence.</em></h1>
        <p className="hero-copy">Bring climate observations and farm profile information together. See what is known, what is missing and what still requires field validation.</p>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">OBJETO DE ANÁLISE</span><h2>Selecione uma exploração</h2></div><span className="status-tag">EVIDENCE-FIRST</span></div>
        {farms.length ? <>
          <label className="rotation-farm-select">EXPLORAÇÃO REGISTADA
            <select value={farmId} onChange={(event) => { setFarmId(event.target.value); setClimate(null); setLoaded(false); }}>
              {farms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          {farm && <><div className="climate-period-controls"><label>DATA INICIAL<input type="date" value={periodStart} max={periodEnd} onChange={(event) => { setPeriodStart(event.target.value); setClimate(null); setLoaded(false); }} /></label><label>DATA FINAL<input type="date" value={periodEnd} min={periodStart} max={new Date(Date.now() - 86400000).toISOString().slice(0,10)} onChange={(event) => { setPeriodEnd(event.target.value); setClimate(null); setLoaded(false); }} /></label></div><div className="rotation-context"><strong>{farm.name}</strong><span>Coordenadas: {farm.latitude}, {farm.longitude}</span><span>Período: {periodStart} a {periodEnd}</span><p>NASA POWER provides gridded regional context, not measurements taken directly inside this farm.</p></div></>}
          <button className="primary-button" onClick={loadAnalysis} disabled={!farm || loading}>{loading ? "A ANALISAR DADOS CLIMÁTICOS…" : "CARREGAR ANÁLISE DA EXPLORAÇÃO ↗"}</button>
        </> : <div className="empty-state"><strong>Nenhuma exploração disponível.</strong><p>Registe uma exploração antes de solicitar uma análise integrada.</p><Link href="/farms">ABRIR GESTÃO DE EXPLORAÇÕES ↗</Link></div>}
        {error && <div className="notice error" role="alert">{error}</div>}
      </section>

      {farm && <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">01 / PROFILE COMPLETENESS</span><h2>Farm data readiness</h2></div><span className="status-tag">{readiness.filter((item) => item.status === "provided").length} / {readiness.length} PROVIDED</span></div>
        <p className="section-copy">This is a completeness check, not a farm quality score. A missing value is not assumed or inferred from location.</p>
        <div className="readiness-grid">{readiness.map((item) => <article className="readiness-card" key={item.label}><div className="farm-card-top"><strong>{item.label}</strong><span className={item.status === "provided" ? "readiness-provided" : "readiness-missing"}>{item.status === "provided" ? "PROVIDED" : "MISSING"}</span></div><p>{item.detail}</p></article>)}</div>
      </section>}

      {farm && <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">02 / FIELD HISTORY</span><h2>Atividade agrícola registada</h2></div><span className="status-tag">{records.length} REGISTOS</span></div>
        <p className="section-copy">Registos introduzidos por membros autorizados desta exploração. São apresentados como histórico declarado/observado; não constituem validação automática nem diagnóstico.</p>
        {recordsLoading ? <p className="section-copy">A carregar histórico…</p> : recordsError ? <div className="notice error">{recordsError}</div> : records.length ? <div className="evidence-list">{records.slice(0,8).map((record) => <article className="farm-card" key={record.id}><div className="farm-card-top"><span className="eyebrow">{record.record_type.replaceAll("_"," ").toUpperCase()}</span><span className="status-tag">{record.occurred_at}</span></div><h3>{record.title}</h3>{record.crop && <p>Cultura: {record.crop}</p>}{record.description && <p>{record.description}</p>}<small>Origem: {record.source.replaceAll("_"," ")}{record.yield_quantity !== null ? ` · Produção registada: ${record.yield_quantity} ${record.yield_unit ?? ""}` : ""}</small></article>)}</div> : <div className="empty-state"><strong>Sem registos agrícolas.</strong><p>Adicione plantios, observações, tratamentos ou resultados no histórico da exploração.</p><Link href={`/farms/${farm.id}/records`}>ABRIR HISTÓRICO AGRÍCOLA ↗</Link></div>}
        <Link href={`/farms/${farm.id}/records`}>CONSULTAR HISTÓRICO COMPLETO ↗</Link>
      </section>}

      {loaded && <section className="workspace">
        <div className="section-heading"><div><span className="eyebrow">02 / ENVIRONMENTAL OBSERVATIONS</span><h2>Climate summary</h2></div><span className="status-tag">NASA POWER · DAILY</span></div>
        <p className="section-copy">Valores diários válidos entre {periodStart} e {periodEnd}. Valores ausentes e códigos de preenchimento são excluídos. A agregação mensal reúne os anos selecionados por mês do calendário.</p>
        <div className="insight-metric-grid">{metrics.map((metric) => <article className="metric" key={metric.key}><span>{metric.label}</span><strong>{metric.key === "PRECTOTCORR" ? (metric.total === null ? "—" : metric.total.toFixed(1)) : (metric.mean === null ? "—" : metric.mean.toFixed(1))}<small> {metric.unit}</small></strong><small>{metric.validDays} / {metric.expectedDays} valid days · {metric.coveragePercent.toFixed(0)}% coverage</small><p>{metric.aggregation}</p></article>)}</div>
        <ClimateCharts parameters={parameterData ?? {}} fillValue={climate?.fillValue ?? -999} periodLabel={periodStart + " a " + periodEnd} />
        <div className="climate-comparison">
          <div className="section-heading"><div><span className="eyebrow">04 / YEAR-OVER-YEAR CONTEXT</span><h2>Comparação com o ano anterior</h2></div><span className="status-tag">{previousYearDate(periodStart)} — {previousYearDate(periodEnd)}</span></div>
          <p className="section-copy">Comparação descritiva entre o intervalo selecionado e as mesmas datas do ano anterior. Os intervalos podem diferir em um dia quando há ajuste de 29 de fevereiro para um ano não bissexto.</p>
          <div className="climate-comparison-grid">
            {metrics.filter((item) => item.key === "T2M" || item.key === "PRECTOTCORR").map((current) => {
              const previous = comparisonMetrics.find((item) => item.key === current.key);
              const currentValue = current.key === "PRECTOTCORR" ? current.total : current.mean;
              const previousValue = current.key === "PRECTOTCORR" ? previous?.total : previous?.mean;
              const difference = currentValue != null && previousValue != null ? currentValue - previousValue : null;
              const unit = current.key === "PRECTOTCORR" ? "mm" : "°C";
              return <article className="climate-comparison-card" key={current.key}>
                <span>{current.key === "T2M" ? "TEMPERATURA MÉDIA" : "PRECIPITAÇÃO ACUMULADA"}</span>
                <strong>{difference === null ? "—" : (difference > 0 ? "+" : "") + difference.toFixed(1) + " " + unit}</strong>
                <p>Atual: {currentValue == null ? "sem dados" : currentValue.toFixed(1) + " " + unit} · Anterior: {previousValue == null ? "sem dados" : previousValue.toFixed(1) + " " + unit}</p>
                <small>Cobertura: {current.coveragePercent.toFixed(0)}% vs {previous ? previous.coveragePercent.toFixed(0) : "—"}%</small>
              </article>;
            })}
          </div>
        </div>
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
