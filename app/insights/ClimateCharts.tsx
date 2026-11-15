"use client";

import { useMemo } from "react";

type Props = {
  parameters: Record<string, Record<string, number>>;
  fillValue: number;
};

type MonthValue = { month: string; value: number | null; days: number };

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function monthlySeries(series: Record<string, number> | undefined, fillValue: number, mode: "mean" | "sum"): MonthValue[] {
  const buckets = Array.from({ length: 12 }, () => ({ total: 0, count: 0 }));
  Object.entries(series ?? {}).forEach(([date, raw]) => {
    if (!/^\\d{8}$/.test(date) || !Number.isFinite(raw) || raw <= -900 || raw === fillValue) return;
    const month = Number(date.slice(4, 6)) - 1;
    if (month < 0 || month > 11) return;
    buckets[month].total += raw;
    buckets[month].count += 1;
  });
  return buckets.map((bucket, index) => ({
    month: MONTHS[index],
    value: bucket.count ? (mode === "mean" ? bucket.total / bucket.count : bucket.total) : null,
    days: bucket.count
  }));
}

function TrendChart({ title, unit, values, description }: {
  title: string; unit: string; values: MonthValue[]; description: string;
}) {
  const available = values.map((item) => item.value).filter((value): value is number => value !== null);
  if (!available.length) return <article className="climate-chart"><h3>{title}</h3><p>Sem valores diários válidos para representar este período.</p></article>;
  const min = Math.min(0, ...available);
  const max = Math.max(...available);
  const span = max - min || 1;
  const points = values.map((item, index) => {
    const x = 30 + index * (540 / 11);
    const y = item.value === null ? null : 150 - ((item.value - min) / span) * 112;
    return { ...item, x, y };
  });
  const path = points.filter((point) => point.y !== null)
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  return <article className="climate-chart">
    <div className="climate-chart-heading"><h3>{title}</h3><span>{unit}</span></div>
    <svg viewBox="0 0 600 190" role="img" aria-label={`${title}, valores mensais`}>
      {[38, 94, 150].map((y) => <line key={y} x1="30" x2="570" y1={y} y2={y} className="climate-gridline" />)}
      <path d={path} className="climate-trend-line" />
      {points.map((point) => point.y === null ? null : <g key={point.month}>
        <circle cx={point.x} cy={point.y} r="4" className="climate-trend-point" />
        <title>{point.month}: {point.value?.toFixed(1)} {unit}; {point.days} dias válidos</title>
      </g>)}
      {points.map((point) => <text key={point.month} x={point.x} y="178" textAnchor="middle" className="climate-axis-label">{point.month}</text>)}
    </svg>
    <p>{description}</p>
    <div className="climate-month-values">{values.map((item) => <span key={item.month}><b>{item.month}</b>{item.value === null ? "—" : item.value.toFixed(1)}<small>{item.days} dias</small></span>)}</div>
  </article>;
}

export default function ClimateCharts({ parameters, fillValue }: Props) {
  const temperature = useMemo(() => monthlySeries(parameters.T2M, fillValue, "mean"), [parameters, fillValue]);
  const precipitation = useMemo(() => monthlySeries(parameters.PRECTOTCORR, fillValue, "sum"), [parameters, fillValue]);
  return <div className="climate-charts">
    <div className="section-heading"><div><span className="eyebrow">03 / MONTHLY PATTERNS</span><h2>Variação ao longo do ano</h2></div><span className="status-tag">DAILY DATA · MONTHLY AGGREGATION</span></div>
    <p className="section-copy">Temperatura: média dos valores diários válidos em cada mês. Precipitação: soma dos valores diários válidos em cada mês. Meses sem dados permanecem em branco; não são interpolados.</p>
    <TrendChart title="Temperatura média do ar" unit="°C" values={temperature} description="Média mensal de T2M; não representa uma medição dentro do terreno." />
    <TrendChart title="Precipitação corrigida" unit="mm" values={precipitation} description="Acumulação mensal de PRECTOTCORR; não equivale à água disponível no solo." />
  </div>;
}
