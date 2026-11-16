"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { analyzeClimate, assessFarmReadiness } from "@/lib/climate-analysis";
import ClimateCharts from "./ClimateCharts";

type Farm = { id:string; name:string; latitude:number; longitude:number; areaHa:number|null; soilTexture:string; soilPh:number|null; organicMatter:number|null; drainage:string; currentCrop:string };
type AgriculturalRecord = { id:string; record_type:string; title:string; description:string|null; occurred_at:string; crop:string|null; observation_status:string|null; input_name:string|null; input_quantity:number|null; input_unit:string|null; yield_quantity:number|null; yield_unit:string|null; source:string };
type ClimateResponse = { fillValue?:number; parameters?:Record<string,{units?:string}>; data?:{properties?:{parameter?:Record<string,Record<string,number>>}}; error?:string };

const dateString = (date:Date) => date.toISOString().slice(0,10);
const toApiDate = (value:string) => value.replaceAll("-","");
const expectedDays = (start:string,end:string) => Math.floor((new Date(end+"T00:00:00Z").getTime()-new Date(start+"T00:00:00Z").getTime())/86400000)+1;
const previousYearDate = (value:string) => { const [year,month,day]=value.split("-").map(Number); return (year-1)+"-"+String(month).padStart(2,"0")+"-"+String(Math.min(day,new Date(Date.UTC(year-1,month,0)).getUTCDate())).padStart(2,"0"); };

export default function InsightsPage() {
  const { locale, t } = useLocale();
  const [farms,setFarms]=useState<Farm[]>([]);
  const [farmId,setFarmId]=useState("");
  const [climate,setClimate]=useState<ClimateResponse|null>(null);
  const [comparisonClimate,setComparisonClimate]=useState<ClimateResponse|null>(null);
  const [records,setRecords]=useState<AgriculturalRecord[]>([]);
  const [recordsLoading,setRecordsLoading]=useState(false);
  const [recordsError,setRecordsError]=useState("");
  const [loading,setLoading]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [error,setError]=useState("");
  const [range,setRange]=useState("custom");
  const [periodStart,setPeriodStart]=useState("2025-10-03");
  const [periodEnd,setPeriodEnd]=useState("2025-12-31");

  useEffect(()=>{
    let active=true;
    async function loadFarms(){
      try{
        const response=await fetch("/api/farms",{cache:"no-store"});
        const payload=await response.json();
        if(!response.ok) throw new Error(t("analytics.loadError"));
        const parsed=(payload.farms??[]).map((farm:{id:string;name:string;latitude:number;longitude:number;area_hectares:number|null;soil_texture:string|null;soil_ph:number|null;organic_matter_pct:number|null;drainage_class:string|null;current_crop:string|null})=>({
          id:farm.id,name:farm.name,latitude:farm.latitude,longitude:farm.longitude,areaHa:farm.area_hectares,
          soilTexture:farm.soil_texture??"",soilPh:farm.soil_ph,organicMatter:farm.organic_matter_pct,
          drainage:farm.drainage_class??"",currentCrop:farm.current_crop??""
        })) as Farm[];
        if(active){setFarms(parsed);if(parsed.length)setFarmId(parsed[0].id);}
      }catch{if(active)setError(t("analytics.loadError"));}
    }
    void loadFarms();
    return()=>{active=false;};
  },[t]);

  const farm=farms.find(item=>item.id===farmId);
  useEffect(()=>{
    if(!farmId){setRecords([]);return;}
    let active=true;
    async function loadRecords(){
      setRecordsLoading(true);setRecordsError("");
      try{
        const response=await fetch(`/api/farms/${farmId}/records`,{cache:"no-store"});
        const payload=await response.json();
        if(!response.ok)throw new Error(t("analytics.recordsError"));
        if(active)setRecords(payload.records??[]);
      }catch{if(active)setRecordsError(t("analytics.recordsError"));}
      finally{if(active)setRecordsLoading(false);}
    }
    void loadRecords();
    return()=>{active=false;};
  },[farmId,t]);

  const readiness=useMemo(()=>farm?assessFarmReadiness(farm):[],[farm]);
  const completed=readiness.filter(item=>item.status==="provided").length;
  const completion=readiness.length?Math.round(completed/readiness.length*100):0;
  const parameterData=climate?.data?.properties?.parameter;
  const metrics=useMemo(()=>parameterData?analyzeClimate({parameters:parameterData,fillValue:climate?.fillValue,start:toApiDate(periodStart),end:toApiDate(periodEnd)}):[],[parameterData,climate?.fillValue,periodStart,periodEnd]);
  const comparisonMetrics=useMemo(()=>{
    const series=comparisonClimate?.data?.properties?.parameter;
    return series?analyzeClimate({parameters:series,fillValue:comparisonClimate?.fillValue,start:toApiDate(previousYearDate(periodStart)),end:toApiDate(previousYearDate(periodEnd))}):[];
  },[comparisonClimate,periodStart,periodEnd]);

  function changeRange(value:string){
    setRange(value);
    if(value==="custom")return;
    const end=new Date();end.setUTCHours(0,0,0,0);end.setUTCDate(end.getUTCDate()-1);
    if(value==="year"){
      const year=end.getUTCFullYear()-1;
      setPeriodStart(`${year}-01-01`);setPeriodEnd(`${year}-12-31`);
    }else{
      const days=Number(value);
      const start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1);
      setPeriodStart(dateString(start));setPeriodEnd(dateString(end));
    }
    setLoaded(false);setClimate(null);setComparisonClimate(null);
  }

  async function loadAnalysis(){
    if(!farm)return;
    setLoading(true);setLoaded(false);setError("");setClimate(null);setComparisonClimate(null);
    const startDate=new Date(periodStart+"T00:00:00Z"),endDate=new Date(periodEnd+"T00:00:00Z");
    const today=new Date();today.setUTCHours(0,0,0,0);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)||Number.isNaN(startDate.getTime())||Number.isNaN(endDate.getTime())||startDate.toISOString().slice(0,10)!==periodStart||endDate.toISOString().slice(0,10)!==periodEnd||startDate>endDate||endDate>=today){setError(t("analytics.invalidDates"));setLoading(false);return;}
    if(expectedDays(periodStart,periodEnd)>3660){setError(t("analytics.maxRange"));setLoading(false);return;}
    try{
      const query=new URLSearchParams({latitude:String(farm.latitude),longitude:String(farm.longitude),start:toApiDate(periodStart),end:toApiDate(periodEnd)});
      const comparisonQuery=new URLSearchParams({latitude:String(farm.latitude),longitude:String(farm.longitude),start:toApiDate(previousYearDate(periodStart)),end:toApiDate(previousYearDate(periodEnd))});
      const [response,comparisonResponse]=await Promise.all([fetch(`/api/climate?${query}`),fetch(`/api/climate?${comparisonQuery}`)]);
      const [payload,comparisonPayload]=await Promise.all([response.json(),comparisonResponse.json()]);
      if(!response.ok||!comparisonResponse.ok)throw new Error(t("analytics.loadError"));
      setClimate(payload);setComparisonClimate(comparisonPayload);setLoaded(true);
    }catch{setError(t("analytics.loadError"));}
    finally{setLoading(false);}
  }

  const metricLabels:Record<string,string>={T2M:t("analytics.temperature"),T2M_MAX:t("analytics.maxTemperature"),T2M_MIN:t("analytics.minTemperature"),PRECTOTCORR:t("analytics.precipitation"),RH2M:t("analytics.humidity")};
  const metricDescriptions:Record<string,string>={T2M:t("analytics.mean"),T2M_MAX:t("analytics.meanMax"),T2M_MIN:t("analytics.meanMin"),PRECTOTCORR:t("analytics.sumRain"),RH2M:t("analytics.meanHumidity")};

  return <main className="shell analytics-shell">
    <header className="topbar">
      <Link className="brand" href="/"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link>
      <nav className="top-nav"><Link href="/farms">{t("nav.farms").toUpperCase()} ↗</Link><Link href="/crops">{t("nav.crops").toUpperCase()} ↗</Link><Link href="/monitoring">{t("nav.monitoring").toUpperCase()} ↗</Link></nav>
      <Link className="analytics-settings-link" href="/dashboard#account-settings" aria-label={t("nav.settings")} title={t("nav.settings")}>⚙</Link>
    </header>

    <section className="farm-hero analytics-hero">
      <span className="eyebrow">SPACEXPLORE / {t("analytics.title").toUpperCase()}</span>
      <h1>{t("analytics.title")}</h1>
      <p className="hero-copy">{t("analytics.subtitle")}</p>
    </section>

    <section className="workspace analytics-control-panel">
      {farms.length?<>
        <div className="analytics-filter-grid">
          <label>{t("analytics.farmLabel")}<select value={farmId} onChange={event=>{setFarmId(event.target.value);setClimate(null);setLoaded(false);}}>{farms.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>{t("analytics.period")}<select value={range} onChange={event=>changeRange(event.target.value)}>
            <option value="30">{t("analytics.period30")}</option><option value="90">{t("analytics.period90")}</option><option value="year">{t("analytics.periodYear")}</option><option value="custom">{t("analytics.custom")}</option>
          </select></label>
          {range==="custom"&&<><label>{t("analytics.start")}<input type="date" value={periodStart} max={periodEnd} onChange={event=>{setPeriodStart(event.target.value);setLoaded(false);}} /></label><label>{t("analytics.end")}<input type="date" value={periodEnd} min={periodStart} max={dateString(new Date(Date.now()-86400000))} onChange={event=>{setPeriodEnd(event.target.value);setLoaded(false);}} /></label></>}
        </div>
        {farm&&<div className="analytics-farm-context"><strong>{farm.name}</strong><span>{t("analytics.coords")}: {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}</span><p>{t("analytics.context")}</p></div>}
        <button className="primary-button analytics-load-button" onClick={loadAnalysis} disabled={!farm||loading}>{loading?t("analytics.loading"):t("analytics.load")+" ↗"}</button>
      </>:<div className="empty-state"><strong>{t("analytics.noFarm")}</strong><p>{t("analytics.addFarm")}</p><Link href="/farms">{t("analytics.openFarms")} ↗</Link></div>}
      {error&&<div className="notice error" role="alert">{error}</div>}
    </section>

    {farm&&<section className="workspace analytics-summary-grid">
      <article className="analytics-summary-card">
        <div className="analytics-summary-top"><div><span className="eyebrow">{t("analytics.profile").toUpperCase()}</span><h2>{completion}%</h2></div><span className="analytics-summary-count">{completed}/{readiness.length}</span></div>
        <div className="analytics-progress-track" role="progressbar" aria-label={t("analytics.profileHint")} aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${completion}%`}} /></div>
        <p>{t("analytics.profileHint")}</p>
      </article>
      <article className="analytics-summary-card">
        <div className="analytics-summary-top"><div><span className="eyebrow">{t("analytics.records").toUpperCase()}</span><h2>{records.length}</h2></div><span className="analytics-summary-count">●</span></div>
        <p>{t("analytics.recordsHint")}</p>
        <Link href={`/farms/${farm.id}/records`}>{t("analytics.openRecords")} ↗</Link>
      </article>
    </section>}

    {farm&&<section className="workspace analytics-history">
      <div className="section-heading"><div><span className="eyebrow">01 / {t("analytics.farmHistory").toUpperCase()}</span><h2>{t("analytics.farmHistory")}</h2></div><span className="status-tag">{records.length}</span></div>
      {recordsLoading?<p className="section-copy">{t("analytics.recordsLoading")}</p>:recordsError?<div className="notice error">{recordsError}</div>:records.length?<div className="evidence-list">{records.slice(0,5).map(record=><article className="farm-card" key={record.id}><div className="farm-card-top"><span className="eyebrow">{record.record_type.replaceAll("_"," ").toUpperCase()}</span><span className="status-tag">{record.occurred_at}</span></div><h3>{record.title}</h3>{record.crop&&<p>{t("analytics.crop")}: {record.crop}</p>}{record.description&&<p>{record.description}</p>}<small>{t("analytics.origin")}: {record.source.replaceAll("_"," ")}{record.yield_quantity!==null?` · ${t("analytics.harvest")}: ${record.yield_quantity} ${record.yield_unit??""}`:""}</small></article>)}</div>:<div className="empty-state"><strong>{t("analytics.recordsEmpty")}</strong><Link href={`/farms/${farm.id}/records`}>{t("analytics.openRecords")} ↗</Link></div>}
      {records.length>5&&<Link href={`/farms/${farm.id}/records`}>{t("analytics.viewAll")} ↗</Link>}
    </section>}

    {loaded&&<section className="workspace analytics-results">
      <div className="section-heading"><div><span className="eyebrow">02 / NASA POWER</span><h2>{t("analytics.climate")}</h2></div><span className="status-tag">{t("analytics.daily")}</span></div>
      <p className="section-copy">{t("analytics.validValues")} {periodStart} — {periodEnd}. {t("analytics.context")}</p>
      <div className="insight-metric-grid">{metrics.map(metric=><article className="metric" key={metric.key}><span>{metricLabels[metric.key]??metric.label}</span><strong>{metric.key==="PRECTOTCORR"?(metric.total===null?"—":metric.total.toFixed(1)):(metric.mean===null?"—":metric.mean.toFixed(1))}<small> {metric.unit}</small></strong><small>{metric.validDays}/{metric.expectedDays} {t("analytics.validDays")} · {metric.coveragePercent.toFixed(0)}% {t("analytics.coverage")}</small><p>{metricDescriptions[metric.key]??metric.aggregation}</p></article>)}</div>
      <ClimateCharts parameters={parameterData??{}} fillValue={climate?.fillValue??-999} periodLabel={periodStart+" — "+periodEnd} />
      <div className="climate-comparison">
        <div className="section-heading"><div><span className="eyebrow">03 / CONTEXTO ANUAL</span><h2>{t("analytics.comparison")}</h2></div><span className="status-tag">{previousYearDate(periodStart)} — {previousYearDate(periodEnd)}</span></div>
        <p className="section-copy">{t("analytics.comparisonHint")}</p>
        <div className="climate-comparison-grid">{metrics.filter(item=>item.key==="T2M"||item.key==="PRECTOTCORR").map(current=>{
          const previous=comparisonMetrics.find(item=>item.key===current.key);
          const currentValue=current.key==="PRECTOTCORR"?current.total:current.mean;
          const previousValue=current.key==="PRECTOTCORR"?previous?.total:previous?.mean;
          const difference=currentValue!=null&&previousValue!=null?currentValue-previousValue:null;
          return <article className="climate-comparison-card" key={current.key}><span>{metricLabels[current.key]}</span><strong>{difference===null?"—":(difference>0?"+":"")+difference.toFixed(1)+" "+current.unit}</strong><p>{t("analytics.current")}: {currentValue==null?t("analytics.noData"):currentValue.toFixed(1)+" "+current.unit} · {t("analytics.previous")}: {previousValue==null?t("analytics.noData"):previousValue.toFixed(1)+" "+current.unit}</p><small>{t("analytics.coverageLabel")}: {current.coveragePercent.toFixed(0)}% / {previous?previous.coveragePercent.toFixed(0):"—"}%</small></article>;
        })}</div>
      </div>
      <div className="analytics-note">{t("analytics.disclaimer")}</div>
    </section>}

    <footer><span>SPACEXPLORE TCHIOWA</span><span>NASA POWER · {locale.toUpperCase()}</span></footer>
  </main>;
}
