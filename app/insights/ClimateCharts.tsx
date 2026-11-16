"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  parameters: Record<string, Record<string, number>>;
  fillValue: number;
  periodLabel: string;
};

type MonthValue = { month: string; value: number | null; days: number };

const MONTHS: Record<string, string[]> = { pt: ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"], en: ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"], fr: ["JAN","FÉV","MAR","AVR","MAI","JUI","JUI","AOÛ","SEP","OCT","NOV","DÉC"], es: ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"] };

function monthlySeries(series: Record<string, number> | undefined, fillValue: number, mode: "mean" | "sum", months: string[]): MonthValue[] {
  const buckets = Array.from({ length: 12 }, () => ({ total: 0, count: 0 }));
  Object.entries(series ?? {}).forEach(([date, raw]) => {
    if (!/^\d{8}$/.test(date) || !Number.isFinite(raw) || raw <= -900 || raw === fillValue) return;
    const month = Number(date.slice(4, 6)) - 1;
    if (month < 0 || month > 11) return;
    buckets[month].total += raw;
    buckets[month].count += 1;
  });
  return buckets.map((bucket, index) => ({
    month: months[index],
    value: bucket.count ? (mode === "mean" ? bucket.total / bucket.count : bucket.total) : null,
    days: bucket.count
  }));
}

function TrendChart({ title, unit, values, description }: {
  title: string; unit: string; values: MonthValue[]; description: string;
}) {
  const { t } = useLocale();
  const available = values.map((item) => item.value).filter((value): value is number => value !== null);
  if (!available.length) return <article className="climate-chart"><h3>{title}</h3><p>{t("analytics.noChart")}</p></article>;
  const min = Math.min(0, ...available);
  const max = Math.max(...available);
  const span = max - min || 1;
  const points = values.map((item, index) => {
    const x = 30 + index * (540 / 11);
    const y = item.value === null ? null : 150 - ((item.value - min) / span) * 112;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => {
    if (point.y === null) return "";
    const previousMissing = index === 0 || points[index - 1].y === null;
    return `${previousMissing ? "M" : "L"} ${point.x} ${point.y}`;
  }).filter(Boolean).join(" ");
  return <article className="climate-chart">
    <div className="climate-chart-heading"><h3>{title}</h3><span>{unit}</span></div>
    <svg viewBox="0 0 600 190" role="img" aria-label={`${title}, ${t("analytics.monthly").toLowerCase()}`}>
      {[38, 94, 150].map((y) => <line key={y} x1="30" x2="570" y1={y} y2={y} className="climate-gridline" />)}
      <path d={path} className="climate-trend-line" />
      {points.map((point) => point.y === null ? null : <g key={point.month}>
        <circle cx={point.x} cy={point.y} r="4" className="climate-trend-point" />
        <title>{point.month}: {point.value?.toFixed(1)} {unit}; {point.days} {t("analytics.days")}</title>
      </g>)}
      {points.map((point) => <text key={point.month} x={point.x} y="178" textAnchor="middle" className="climate-axis-label">{point.month}</text>)}
    </svg>
    <p>{description}</p>
    <div className="climate-month-values">{values.map((item) => <span key={item.month}><b>{item.month}</b>{item.value === null ? "—" : item.value.toFixed(1)}<small>{item.days} {t("analytics.days")}</small></span>)}</div>
  </article>;
}

export default function ClimateCharts({ parameters, fillValue, periodLabel }: Props) {
  const { locale, t } = useLocale();
  const months = MONTHS[locale];
  const temperature = useMemo(() => monthlySeries(parameters.T2M, fillValue, "mean", months), [parameters, fillValue, months]);
  const precipitation = useMemo(() => monthlySeries(parameters.PRECTOTCORR, fillValue, "sum", months), [parameters, fillValue]);
  return <div className="climate-charts">
    <div className="section-heading"><div><span className="eyebrow">03 / {t("analytics.monthly").toUpperCase()}</span><h2>{t("analytics.monthly")}</h2></div><span className="status-tag">{periodLabel}</span></div>
    <p className="section-copy">{t("analytics.monthlyHint")}</p>
    <TrendChart title={t("analytics.temperature")} unit="°C" values={temperature} description={t("analytics.mean")} />
    <TrendChart title={t("analytics.precipitation")} unit="mm" values={precipitation} description={t("analytics.sumRain")} />
  </div>;
}
