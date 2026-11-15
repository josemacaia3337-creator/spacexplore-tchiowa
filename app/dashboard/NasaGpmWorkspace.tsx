"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type GpmItem = {
  id: string;
  displayName: string;
  date: string;
  previewUrl: string | null;
  source: string;
  resolution: string;
};
type GpmResult = {
  source: string;
  sourceUrl: string;
  product: string;
  productName: string;
  unit: string;
  temporalResolution: string;
  spatialResolution: string;
  availabilityWindowDays: number;
  totalItems: number;
  retrievedAt: string;
  location: { latitude: number; longitude: number };
  requestedPeriod: { start: string; end: string };
  items: GpmItem[];
};
function validDate(value: string) {
  if (value.length !== 10 || value[4] !== "-" || value[7] !== "-") return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function dateLabel(value: string) {
  if (!validDate(value)) return value;
  return new Date(value + "T00:00:00Z").toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

export default function NasaGpmWorkspace({
  autoRun, initialLatitude, initialLongitude, initialStart, initialEnd, farmName,
}: {
  autoRun: boolean;
  initialLatitude: string;
  initialLongitude: string;
  initialStart: string;
  initialEnd: string;
  farmName: string;
}) {
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [result, setResult] = useState<GpmResult | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoRequested = useRef(false);

  const loadGpm = useCallback(async (query: { latitude: string; longitude: string; start: string; end: string }) => {
    const lat = Number(query.latitude), lon = Number(query.longitude);
    if (!query.latitude.trim() || !query.longitude.trim() || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError("Indique coordenadas válidas: latitude entre -90 e 90 e longitude entre -180 e 180.");
      setResult(null); return;
    }
    if (!validDate(query.start) || !validDate(query.end) || query.start > query.end) {
      setError("Selecione datas reais e confirme a ordem do período.");
      setResult(null); return;
    }
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const first = new Date(query.start + "T00:00:00Z"), last = new Date(query.end + "T00:00:00Z");
    const oldest = new Date(today); oldest.setUTCDate(oldest.getUTCDate() - 59);
    if (first < oldest || last > today || Math.floor((last.getTime() - first.getTime()) / 86400000) + 1 > 60) {
      setError("O NASA GPM Publisher permite consultar uma janela móvel dos últimos 60 dias, sem datas futuras.");
      setResult(null); return;
    }
    setLoading(true); setError(""); setResult(null); setSelectedDate("");
    try {
      const params = new URLSearchParams({ latitude: query.latitude.trim(), longitude: query.longitude.trim(), start: query.start, end: query.end });
      const response = await fetch(`/api/gpm?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `Pedido não concluído (HTTP ${response.status}).`);
      setResult(payload as GpmResult);
      const available = Array.isArray(payload.items) ? payload.items as GpmItem[] : [];
      setSelectedDate(available.length ? available[available.length - 1].date : "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os dados NASA GPM.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!autoRun || autoRequested.current) return;
    autoRequested.current = true;
    void loadGpm({ latitude: initialLatitude, longitude: initialLongitude, start: initialStart, end: initialEnd });
  }, [autoRun, initialLatitude, initialLongitude, initialStart, initialEnd, loadGpm]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadGpm({ latitude, longitude, start, end });
  }

  const selectedItem = result?.items.find((item) => item.date === selectedDate) ?? null;
  const previewCount = result?.items.filter((item) => item.previewUrl).length ?? 0;

  return (
    <section className="dashboard-section nasa-gpm-workspace" id="nasa-gpm">
      <div className="dashboard-section-heading">
        <div><span className="eyebrow">02 / PRECIPITAÇÃO POR SATÉLITE · NASA</span><h2>NASA GPM · IMERG</h2></div>
        <span className="status-tag">LATE RUN · 1 DIA</span>
      </div>
      <p className="nasa-gpm-copy">Explore acumulações diárias de precipitação estimadas pelo produto IMERG Late Run. A consulta seleciona a região NASA que contém as coordenadas indicadas e disponibiliza as imagens e metadados oficiais para as datas encontradas.</p>
      {farmName && <p className="nasa-gpm-context">Consulta solicitada para <strong>{farmName}</strong>.</p>}
      <form className="nasa-gpm-form" onSubmit={submit}>
        <label>LATITUDE<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" required /></label>
        <label>LONGITUDE<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" required /></label>
        <label>DATA INICIAL<input type="date" value={start} onChange={(event) => setStart(event.target.value)} required /></label>
        <label>DATA FINAL<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} required /></label>
        <button type="submit" disabled={loading}>{loading ? "A CONSULTAR NASA GPM…" : "CONSULTAR PRECIPITAÇÃO ↗"}</button>
      </form>
      {loading && <p className="nasa-gpm-status" role="status">A solicitar ao NASA PMM Publisher as acumulações diárias para a região e período selecionados…</p>}
      {error && <p className="nasa-gpm-error" role="alert">{error}</p>}
      {result && result.items.length === 0 && <div className="nasa-gpm-empty">O NASA GPM Publisher não devolveu produtos diários para este período e região. Isto pode acontecer quando o produto ainda está a ser processado ou não está disponível para a data selecionada. Nenhum dado de demonstração foi utilizado.</div>}
      {result && result.items.length > 0 && (
        <div className="nasa-gpm-result">
          <div className="nasa-gpm-result-head"><h3>Produtos IMERG encontrados</h3><span>{result.items.length} DATA(S) · {previewCount} PRÉ-VISUALIZAÇÃO(ÕES)</span></div>
          <div className="nasa-gpm-result-controls">
            <label>DATA DISPONÍVEL<select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>{result.items.map((item) => <option key={item.id} value={item.date}>{dateLabel(item.date)}</option>)}</select></label>
            <label>PRODUTO SELECIONADO<strong>{selectedItem?.displayName ?? "—"}</strong></label>
          </div>
          {selectedItem?.previewUrl ? (
            <figure className="nasa-gpm-map">
              <img src={selectedItem.previewUrl} alt={`Pré-visualização regional NASA GPM IMERG para ${dateLabel(selectedItem.date)}`} loading="lazy" referrerPolicy="no-referrer" />
              <figcaption>Pré-visualização regional oficial NASA GPM · {dateLabel(selectedItem.date)}. A imagem representa a região que contém as coordenadas consultadas, não um valor de precipitação extraído no ponto exato.</figcaption>
            </figure>
          ) : <div className="nasa-gpm-empty">O produto existe, mas a NASA não disponibilizou uma pré-visualização para esta data.</div>}
          <div className="nasa-gpm-metadata">
            <article className="nasa-gpm-meta-card"><span>ACUMULAÇÃO</span><strong>1 dia · mm</strong></article>
            <article className="nasa-gpm-meta-card"><span>RESOLUÇÃO ESPACIAL</span><strong>{result.spatialResolution}</strong></article>
            <article className="nasa-gpm-meta-card"><span>RESOLUÇÃO TEMPORAL</span><strong>{result.temporalResolution}</strong></article>
            <article className="nasa-gpm-meta-card"><span>DIAS DISPONÍVEIS</span><strong>{result.items.length} / {result.availabilityWindowDays}</strong></article>
          </div>
          <p className="nasa-gpm-provenance">Fonte: {result.source} · Produto: {result.product} · Região selecionada a partir de {result.location.latitude}, {result.location.longitude} · Período pedido: {result.requestedPeriod.start}–{result.requestedPeriod.end}.</p>
          <p className="nasa-gpm-provenance">Consulta à fonte em: {new Date(result.retrievedAt).toLocaleString("pt-PT")}. Produtos encontrados: {result.items.map((item) => item.date).join(", ")}.</p>
          <p className="nasa-gpm-provenance"><a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">Documentação oficial NASA GPM / PMM Publisher ↗</a></p>
        </div>
      )}
      <p className="nasa-gpm-science-note">Limitações: o produto IMERG é uma estimativa de precipitação por satélite numa grelha de aproximadamente 10 km. A pré-visualização é regional; esta versão ainda não extrai o valor numérico do pixel no ponto exato nem substitui pluviômetros ou validação local. O IMERG Late Run tem atraso de processamento e não deve ser descrito como tempo real.</p>
    </section>
  );
}
