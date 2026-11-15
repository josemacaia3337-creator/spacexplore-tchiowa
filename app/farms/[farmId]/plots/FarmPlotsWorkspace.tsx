"use client";
import { useEffect,useRef,useState } from "react";
import { createFarmPlot,createFarmCropCycle,updateFarmCropCycle } from "./actions";

type PolygonGeometry={type:"Polygon";coordinates:number[][][]};
type Cycle={id:string;crop_name:string;variety:string|null;planting_date:string|null;expected_harvest_date:string|null;actual_harvest_date:string|null;status:string;source:string;notes:string|null};
type Plot={id:string;name:string;area_hectares:number;notes:string|null;boundary_geojson:PolygonGeometry;cycles:Cycle[]};
type Props={farmId:string;farmName:string;latitude:number|null;longitude:number|null;farmBoundary:PolygonGeometry|null;plots:Plot[];canEdit:boolean};
type Position=[number,number];
const statusLabels:Record<string,string>={planned:"Planeada",planted:"Plantada",growing:"Em crescimento",harvested:"Colhida",failed:"Perdida",cancelled:"Cancelada"};
const cycleDate=(value:string|null)=>value?new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(value+"T00:00:00Z")):"Não indicada";

export default function FarmPlotsWorkspace({farmId,farmName,latitude,longitude,farmBoundary,plots,canEdit}:Props){
 const mapElement=useRef<HTMLDivElement>(null);const drawingRef=useRef(false);const layersRef=useRef<import("leaflet").LayerGroup|null>(null);
 const [drawing,setDrawing]=useState(false);const [points,setPoints]=useState<Position[]>([]);const [geometry,setGeometry]=useState<PolygonGeometry|null>(null);
 const [mapReady,setMapReady]=useState(false);const [mapError,setMapError]=useState("");
 useEffect(()=>{drawingRef.current=drawing;},[drawing]);
 useEffect(()=>{
  let disposed=false;let map:import("leaflet").Map|null=null;let clickHandler:((event:import("leaflet").LeafletMouseEvent)=>void)|null=null;
  import("leaflet").then(L=>{
   if(disposed||!mapElement.current)return;
   const center:[number,number]=latitude!==null&&longitude!==null?[latitude,longitude]:[-5.55,12.19];
   map=L.map(mapElement.current,{center,zoom:15,scrollWheelZoom:true});
   const tileUrl=process.env.NEXT_PUBLIC_MAP_TILE_URL||"https://tile.openstreetmap.org/{z}/{x}/{y}.png";
   const attribution=process.env.NEXT_PUBLIC_MAP_ATTRIBUTION||'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
   L.tileLayer(tileUrl,{maxZoom:19,attribution}).addTo(map);layersRef.current=L.layerGroup().addTo(map);
   if(farmBoundary){const parent=L.geoJSON(farmBoundary as never,{style:{color:"#234d35",weight:3,fillColor:"#9abf6d",fillOpacity:.06,dashArray:"8 5"}}).addTo(map);map.fitBounds(parent.getBounds(),{padding:[20,20],maxZoom:17});}
   clickHandler=event=>{if(!drawingRef.current)return;setPoints(current=>[...current,[event.latlng.lat,event.latlng.lng]]);setGeometry(null);setMapError("");};
   map.on("click",clickHandler);setMapReady(true);window.setTimeout(()=>map?.invalidateSize(),100);
  }).catch(()=>setMapError("Não foi possível carregar o mapa. Verifique a ligação e tente novamente."));
  return()=>{disposed=true;if(map&&clickHandler)map.off("click",clickHandler);map?.remove();layersRef.current=null;setMapReady(false);};
 },[latitude,longitude,farmBoundary]);
 useEffect(()=>{
  let disposed=false;import("leaflet").then(L=>{
   if(disposed||!mapReady||!layersRef.current)return;const layer=layersRef.current;layer.clearLayers();
   plots.forEach((plot,index)=>{const shape=L.geoJSON(plot.boundary_geojson as never,{style:{color:["#1f6b52","#2b7a9b","#9b7136","#6d5c9a","#8a536b"][index%5],weight:2,fillOpacity:.2}}).addTo(layer);shape.bindTooltip(plot.name+" · "+Number(plot.area_hectares).toFixed(4)+" ha");});
   const latLngs=points.map(([lat,lng])=>L.latLng(lat,lng));
   if(latLngs.length>=2)L.polyline(latLngs,{color:"#e0a83a",weight:3,dashArray:"7 6"}).addTo(layer);
   latLngs.forEach((point,index)=>L.circleMarker(point,{radius:5,color:"#624515",fillColor:"#f4c66b",fillOpacity:1,weight:2}).bindTooltip("Ponto "+(index+1)).addTo(layer));
   if(geometry&&latLngs.length>=3)L.polygon(latLngs,{color:"#e0a83a",fillColor:"#f4c66b",fillOpacity:.18,weight:3}).addTo(layer);
  });return()=>{disposed=true;};
 },[plots,points,geometry,mapReady]);
 function startDrawing(){setPoints([]);setGeometry(null);setDrawing(true);setMapError("");}
 function undoPoint(){setPoints(current=>current.slice(0,-1));setGeometry(null);}
 function closePolygon(){if(points.length<3){setMapError("Marque pelo menos três pontos para formar o talhão.");return;}const ring=points.map(([lat,lng])=>[lng,lat]);ring.push([...ring[0]]);setGeometry({type:"Polygon",coordinates:[ring]});setDrawing(false);setMapError("");}
 function clearPolygon(){setPoints([]);setGeometry(null);setDrawing(false);setMapError("");}
 return <div className="farm-plots-workspace">
  <div className="section-heading"><div><span className="eyebrow">MAPA DE MANEIO</span><h2>Talhões da propriedade</h2></div><span className="status-tag">{plots.length} TALHÕES</span></div>
  <p className="section-copy">Cada talhão é uma unidade de gestão dentro da fazenda. Os limites são desenhados pelo utilizador, calculados no servidor e verificados para permanecer dentro da propriedade e não se sobreporem a outros talhões.</p>
  <div className="farm-plots-map" ref={mapElement} aria-label="Mapa de talhões dentro da propriedade"/>
  {canEdit&&<div className="boundary-toolbar farm-plots-toolbar">{!drawing?<button className="primary" type="button" onClick={startDrawing}>DESENHAR NOVO TALHÃO</button>:<><button type="button" onClick={undoPoint} disabled={!points.length}>DESFAZER PONTO</button><button className="primary" type="button" onClick={closePolygon} disabled={points.length<3}>FECHAR POLÍGONO</button></>}<button type="button" onClick={clearPolygon} disabled={!points.length&&!geometry}>LIMPAR</button><span className="farm-map-point-count">{points.length} PONTOS MARCADOS</span></div>}
  {mapError&&<p className="auth-error" role="alert">{mapError}</p>}
  {canEdit&&<form className="farm-form farm-plot-form" action={createFarmPlot}>
   <input type="hidden" name="farm_id" value={farmId}/><input type="hidden" name="boundary_geojson" value={geometry?JSON.stringify(geometry):""}/>
   <div className="form-section-title">IDENTIFICAÇÃO DO TALHÃO E CULTURA</div>
   <div className="form-grid">
    <label>NOME DO TALHÃO *<input name="name" required minLength={2} maxLength={100} placeholder="Ex.: Talhão Norte"/></label>
    <label>CULTURA *<input name="crop_name" required minLength={2} maxLength={100} placeholder="Ex.: mandioca, milho, feijão"/></label>
    <label>VARIEDADE / CULTIVAR<input name="variety" maxLength={100} placeholder="Opcional — nome local ou cultivar"/></label>
    <label>ESTADO DO CICLO<select name="crop_status" defaultValue="planned"><option value="planned">Planeado</option><option value="planted">Plantado</option><option value="growing">Em crescimento</option></select></label>
    <label>DATA DE PLANTIO<input name="planting_date" type="date"/></label><label>PREVISÃO DE COLHEITA<input name="expected_harvest_date" type="date"/></label>
   </div>
   <label className="full-label">NOTAS / CONTEXTO<textarea name="notes" rows={3} placeholder="Observações fornecidas pelo agricultor ou técnico."/></label>
   <p className="farm-map-instructions">{geometry?"Polígono fechado. A área será calculada e validada no servidor.":"Desenhe primeiro o polígono no mapa. A cultura e as datas são informação declarada, não previsões automáticas."}</p>
   <button className="primary-button" type="submit" disabled={!geometry}>GUARDAR TALHÃO E CICLO DE CULTURA ↗</button>
  </form>}
  {!canEdit&&<p className="section-copy">A sua função permite consultar os talhões, mas não criar nem alterar ciclos agrícolas.</p>}
  <div className="farm-plot-list">{!plots.length?<div className="empty-state"><strong>Ainda não existem talhões mapeados.</strong><p>Desenhe o primeiro talhão para associar a sua cultura e acompanhar as atividades naquela área.</p></div>:plots.map(plot=>{
   const active=plot.cycles.find(cycle=>["planned","planted","growing"].includes(cycle.status));
   return <article className="farm-plot-card" key={plot.id}>
    <div className="farm-card-top"><span className="eyebrow">UNIDADE DE MANEIO</span><span className="status-tag">{Number(plot.area_hectares).toFixed(4)} ha</span></div><h3>{plot.name}</h3>
    {active?<div className="farm-plot-current-crop"><span>CULTURA ACTUAL</span><strong>{active.crop_name}</strong><small>{active.variety||"Variedade não indicada"} · {statusLabels[active.status]}</small><div className="farm-facts"><span>PLANTIO<strong>{cycleDate(active.planting_date)}</strong></span><span>COLHEITA PREVISTA<strong>{cycleDate(active.expected_harvest_date)}</strong></span></div></div>:<div className="empty-state farm-plot-no-cycle"><strong>Sem ciclo activo.</strong><p>O talhão está disponível para uma nova cultura.</p></div>}
    <div className="farm-plot-history"><span className="eyebrow">HISTÓRICO DE CICLOS · {plot.cycles.length}</span>
     {plot.cycles.map(cycle=><div className="farm-cycle-row" key={cycle.id}><div><strong>{cycle.crop_name}</strong><small>{statusLabels[cycle.status]} · Plantio: {cycleDate(cycle.planting_date)}{cycle.actual_harvest_date?" · Colheita: "+cycleDate(cycle.actual_harvest_date):""}</small></div>
      {canEdit&&["planned","planted","growing"].includes(cycle.status)&&<details><summary>ACTUALIZAR CICLO</summary><form action={updateFarmCropCycle} className="farm-cycle-update-form"><input type="hidden" name="farm_id" value={farmId}/><input type="hidden" name="cycle_id" value={cycle.id}/><label>ESTADO<select name="status" defaultValue={cycle.status}><option value="planned">Planeado</option><option value="planted">Plantado</option><option value="growing">Em crescimento</option><option value="harvested">Colhido</option><option value="failed">Perdido</option><option value="cancelled">Cancelado</option></select></label><label>DATA REAL DA COLHEITA<input type="date" name="actual_harvest_date"/></label><button className="primary-button" type="submit">ACTUALIZAR</button></form></details>}
     </div>)}
    </div>
    {!active&&canEdit&&<details className="farm-new-cycle"><summary>REGISTAR NOVA CULTURA NESTE TALHÃO</summary><form action={createFarmCropCycle} className="farm-form"><input type="hidden" name="farm_id" value={farmId}/><input type="hidden" name="plot_id" value={plot.id}/><div className="form-grid"><label>CULTURA *<input name="crop_name" required minLength={2} maxLength={100}/></label><label>VARIEDADE<input name="variety" maxLength={100}/></label><label>ESTADO<select name="status" defaultValue="planned"><option value="planned">Planeado</option><option value="planted">Plantado</option><option value="growing">Em crescimento</option></select></label><label>DATA DE PLANTIO<input name="planting_date" type="date"/></label><label>COLHEITA PREVISTA<input name="expected_harvest_date" type="date"/></label></div><label className="full-label">NOTAS<textarea name="notes" rows={2}/></label><button className="primary-button" type="submit">GUARDAR NOVO CICLO ↗</button></form></details>}
    <div className="farm-actions"><Link className="farm-climate-link" href={`/farms/${farmId}/records?plot=${plot.id}`}>REGISTAR ACTIVIDADE NESTE TALHÃO ↗</Link></div>
   </article>;
  })}</div>
 </div>;
}
