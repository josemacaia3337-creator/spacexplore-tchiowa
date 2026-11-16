"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type ClimateResult = {
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  timeStandard?: string;
  fillValue?: number;
  location?: { latitude: number; longitude: number };
  requestedPeriod?: { start: string; end: string };
  parameters?: Record<string, { units?: string; longname?: string }>;
  data?: { properties?: { parameter?: Record<string, Record<string, number>> } };
};
type Query = { latitude: string; longitude: string; start: string; end: string };
const LABELS: Record<string, string> = {
  T2M: "Temperatura média",
  T2M_MAX: "Temperatura máxima",
  T2M_MIN: "Temperatura mínima",
  PRECTOTCORR: "Precipitação média diária",
  RH2M: "Humidade relativa",
};
function isValidDate(value: string) {
  if (!/^[0-9]{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4)), month = Number(value.slice(4, 6)), day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function dateInputValue(value: string) {
  return /^[0-9]{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : "";
}

export default function NasaPowerWorkspace({
  autoRun, initialLatitude, initialLongitude, initialStart, initialEnd, farmName,
}: {
  autoRun: boolean; initialLatitude: string; initialLongitude: string;
  initialStart: string; initialEnd: string; farmName: string;
}) {
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [result, setResult] = useState<ClimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoRequested = useRef(false);

  const loadClimate = useCallback(async (query: Query) => {
    const lat = Number(query.latitude), lon = Number(query.longitude);
    if (!query.latitude.trim() || !query.longitude.trim() || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError("Indique coordenadas válidas: latitude entre -90 e 90 e longitude entre -180 e 180.");
      setResult(null); return;
    }
    if (!isValidDate(query.start) || !isValidDate(query.end) || query.start > query.end) {
      setError("Indique datas reais no formato AAAAMMDD e confirme a ordem do período.");
      setResult(null); return;
    }
    const first = Date.UTC(Number(query.start.slice(0, 4)), Number(query.start.slice(4, 6)) - 1, Number(query.start.slice(6, 8)));
    const last = Date.UTC(Number(query.end.slice(0, 4)), Number(query.end.slice(4, 6)) - 1, Number(query.end.slice(6, 8)));
    if (Math.floor((last - first) / 86400000) + 1 > 3660) {
      setError("Selecione um período máximo de 10 anos para manter a consulta responsiva.");
      setResult(null); return;
    }
    setLoading(true); setError(""); setResult(null);
    try {
      const params = new URLSearchParams({ latitude: query.latitude.trim(), longitude: query.longitude.trim(), start: query.start, end: query.end });
      const response = await fetch(`/api/climate?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `Pedido não concluído (HTTP ${response.status}).`);
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os dados NASA POWER.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!autoRun || autoRequested.current) return;
    autoRequested.current = true;
    void loadClimate({ latitude: initialLatitude, longitude: initialLongitude, start: initialStart, end: initialEnd });
  }, [autoRun, initialLatitude, initialLongitude, initialStart, initialEnd, loadClimate]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadClimate({ latitude, longitude, start, end });
  }
  const observations = result?.data?.properties?.parameter;
  const metadata = result?.parameters ?? {};

  return (
    <section className="dashboard-section nasa-power-workspace" id="nasa-power">
      <div className="dashboard-section-heading">
        <div><span className="eyebrow">01 / DADOS CLIMÁTICOS · NASA</span><h2>NASA POWER</h2></div>
        <span className="status-tag">DAILY · PONTO GEOGRÁFICO</span>
      </div>
      <p className="nasa-workspace-copy">Consulte séries históricas de temperatura, precipitação e humidade relativa. A consulta utiliza o serviço NASA POWER já integrado na plataforma e mantém a origem e o período dos dados visíveis.</p>
      {farmName && <p className="nasa-farm-context">Consulta solicitada para <strong>{farmName}</strong>.</p>}
      <form className="nasa-query-form" onSubmit={submit}>
        <label>LATITUDE<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" required /></label>
        <label>LONGITUDE<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" required /></label>
        <label>DATA INICIAL<input type="date" value={dateInputValue(start)} onChange={(event) => setStart(event.target.value.replaceAll("-", ""))} required /></label>
        <label>DATA FINAL<input type="date" value={dateInputValue(end)} onChange={(event) => setEnd(event.target.value.replaceAll("-", ""))} required /></label>
        <button type="submit" disabled={loading}>{loading ? "A CONSULTAR NASA POWER…" : "CONSULTAR DADOS ↗"}</button>
      </form>
      {loading && <p className="nasa-query-status" role="status">A obter dados do NASA POWER para as coordenadas e o período selecionados…</p>}
      {error && <p className="nasa-query-error" role="alert">{error}</p>}
      {observations && (
        <div className="nasa-results">
          <div className="nasa-results-heading"><h3>Indicadores ambientais</h3><span>FONTE · NASA POWER DAILY API</span></div>
          <div className="nasa-metric-grid">
            {Object.entries(observations).map(([key, values]) => {
              const fill = result?.fillValue ?? -999;
              const valid = Object.values(values).filter((value) => Number.isFinite(value) && value !== fill && value > -900);
              const average = valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
              return <article className="nasa-metric" key={key}>
                <span>{LABELS[key] ?? metadata[key]?.longname ?? key}</span>
                <strong>{average === null ? "—" : average.toFixed(1)}<small> {metadata[key]?.units ?? ""}</small></strong>
                <small>{valid.length.toLocaleString("pt-PT")} observações diárias válidas</small>
              </article>;
            })}
          </div>
          <p className="nasa-provenance">Coordenadas: {result?.location?.latitude}, {result?.location?.longitude} · Período: {result?.requestedPeriod?.start}–{result?.requestedPeriod?.end} · Fuso: {result?.timeStandard}</p>
          <p className="nasa-provenance">Obtido em: {result?.retrievedAt ? new Date(result.retrievedAt).toLocaleString("pt-PT") : "—"}. Os valores apresentados são médias das observações diárias válidas. A precipitação apresentada é uma média diária, não o acumulado do período.</p>
        </div>
      )}
      <p className="nasa-science-note">Nota científica: os dados NASA POWER são estimativas em grelha para contexto regional, não medições diretas nos limites de uma propriedade. Dados históricos não constituem previsões e não substituem medições de campo ou validação agronómica.</p>
    </section>
  );
}
