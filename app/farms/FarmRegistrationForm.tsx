"use client";

import { useEffect, useRef, useState } from "react";
import { createFarm } from "./actions";

type OrganizationOption = { id: string; name: string };
type Position = [number, number];
type PolygonGeometry = { type: "Polygon"; coordinates: number[][][] };

export default function FarmRegistrationForm({
  organizations,
  defaultOrganizationId,
}: {
  organizations: OrganizationOption[];
  defaultOrganizationId: string;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const drawingRef = useRef(false);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<Position[]>([]);
  const [geometry, setGeometry] = useState<PolygonGeometry | null>(null);
  const [mapError, setMapError] = useState("");
  const [latitude, setLatitude] = useState("-5.55");
  const [longitude, setLongitude] = useState("12.19");

  useEffect(() => { drawingRef.current = drawing; }, [drawing]);

  useEffect(() => {
    let disposed = false;
    let localMap: import("leaflet").Map | null = null;
    let clickHandler: ((event: import("leaflet").LeafletMouseEvent) => void) | null = null;
    import("leaflet").then((L) => {
      if (disposed || !mapElement.current) return;
      localMap = L.map(mapElement.current, { center: [-5.55, 12.19], zoom: 14, scrollWheelZoom: true });
      mapRef.current = localMap;
      const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      const attribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
      L.tileLayer(tileUrl, { maxZoom: 19, attribution }).addTo(localMap);
      layerRef.current = L.layerGroup().addTo(localMap);
      clickHandler = (event) => {
        if (!drawingRef.current) return;
        setPoints((current) => [...current, [event.latlng.lat, event.latlng.lng]]);
        setGeometry(null);
        setMapError("");
      };
      localMap.on("click", clickHandler);
      window.setTimeout(() => localMap?.invalidateSize(), 100);
    }).catch(() => setMapError("Não foi possível carregar o mapa. Pode guardar a localização pelas coordenadas e delimitar depois."));
    return () => {
      disposed = true;
      if (localMap && clickHandler) localMap.off("click", clickHandler);
      localMap?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lat = Number(latitude), lng = Number(longitude);
    const map = mapRef.current;
    if (map && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !layerRef.current) return;
      const layers = layerRef.current;
      layers.clearLayers();
      const latLngs = points.map(([lat, lng]) => L.latLng(lat, lng));
      if (latLngs.length >= 2) L.polyline(latLngs, { color: "#68d8ed", weight: 3, dashArray: "7 6" }).addTo(layers);
      if (geometry && latLngs.length >= 3) {
        L.polygon(latLngs, { color: "#68d8ed", fillColor: "#2d9ec1", fillOpacity: 0.2, weight: 3 }).addTo(layers);
      }
      latLngs.forEach((point, index) => L.circleMarker(point, {
        radius: 5, color: "#244c38", fillColor: "#d7ed83", fillOpacity: 1, weight: 2,
      }).bindTooltip("Ponto " + (index + 1)).addTo(layers));
    });
    return () => { disposed = true; };
  }, [points, geometry]);

  function startDrawing() {
    setPoints([]);
    setGeometry(null);
    setDrawing(true);
    setMapError("");
  }

  function undoPoint() {
    setPoints((current) => current.slice(0, -1));
    setGeometry(null);
  }

  function closePolygon() {
    if (points.length < 3) {
      setMapError("Marque pelo menos três pontos para delimitar a fazenda.");
      return;
    }
    const ring = points.map(([lat, lng]) => [lng, lat]);
    ring.push([...ring[0]]);
    setGeometry({ type: "Polygon", coordinates: [ring] });
    setDrawing(false);
    setMapError("");
  }

  function clearBoundary() {
    setPoints([]);
    setGeometry(null);
    setDrawing(false);
    setMapError("");
  }

  return (
    <form className="farm-form" action={createFarm}>
      <div className="form-section-title">ORGANIZAÇÃO E IDENTIFICAÇÃO</div>
      <div className="form-grid">
        <label>ORGANIZAÇÃO *
          <select name="organization_id" required defaultValue={defaultOrganizationId}>
            {organizations.length !== 1 && <option value="">Selecione uma organização</option>}
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </label>
        <label>NOME DA FAZENDA *
          <input name="name" minLength={2} maxLength={120} required placeholder="Ex.: Fazenda Maiombe" />
        </label>
        <label>PROVÍNCIA / MUNICÍPIO / LOCALIDADE
          <input name="location_label" defaultValue="Cabinda, Angola" placeholder="Município, comuna ou localidade" />
        </label>
        <label>ÁREA DECLARADA (HECTARES)
          <input name="area_hectares" type="number" min="0.01" step="any" placeholder="Opcional — separada da área calculada" />
        </label>
        <label>LATITUDE *
          <input name="latitude" type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} required />
        </label>
        <label>LONGITUDE *
          <input name="longitude" type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} required />
        </label>
        <label>CULTURA PRINCIPAL ATUAL
          <input name="current_crop" placeholder="Ex.: mandioca, milho, feijão" />
        </label>
      </div>

      <div className="form-section-title">DELIMITAÇÃO GEOGRÁFICA <span>RECOMENDADO · PODE SER CONCLUÍDO DEPOIS</span></div>
      <p className="section-copy farm-map-instructions">Aproxime o mapa, inicie o desenho e marque os vértices que contornam a fazenda. O polígono será validado e a área geodésica será calculada pelo PostGIS quando guardar o registo.</p>
      <div className="farm-registration-map" ref={mapElement} aria-label="Mapa interativo para delimitar a fazenda" />
      <div className="boundary-toolbar farm-registration-toolbar">
        {!drawing
          ? <button className="primary" type="button" onClick={startDrawing}>DESENHAR LIMITES DA FAZENDA</button>
          : <>
              <button type="button" onClick={undoPoint} disabled={!points.length}>DESFAZER PONTO</button>
              <button className="primary" type="button" onClick={closePolygon} disabled={points.length < 3}>FECHAR POLÍGONO</button>
            </>}
        <button type="button" onClick={clearBoundary} disabled={!points.length && !geometry}>LIMPAR DESENHO</button>
        <span className="farm-map-point-count">{points.length} PONTOS MARCADOS</span>
      </div>
      <input type="hidden" name="boundary_geojson" value={geometry ? JSON.stringify(geometry) : ""} />
      {geometry && <p className="form-message" role="status">Limites desenhados. A área será calculada e guardada no servidor.</p>}
      {mapError && <p className="auth-error" role="alert">{mapError}</p>}

      <div className="form-section-title">PERFIL DO SOLO <span>INFORMAÇÃO DECLARADA OU MEDIDA · OPCIONAL</span></div>
      <div className="form-grid">
        <label>TEXTURA DO SOLO
          <select name="soil_texture" defaultValue=""><option value="">Não informado</option><option value="sandy">Arenoso</option><option value="loamy_sand">Franco-arenoso</option><option value="loam">Franco</option><option value="silty">Siltoso</option><option value="clay_loam">Franco-argiloso</option><option value="clay">Argiloso</option><option value="unknown">Desconhecido / não analisado</option></select>
        </label>
        <label>pH DO SOLO (0–14)<input name="soil_ph" type="number" min="0" max="14" step="0.1" placeholder="Opcional" /></label>
        <label>MATÉRIA ORGÂNICA (%)<input name="organic_matter_pct" type="number" min="0" max="100" step="0.1" placeholder="Opcional" /></label>
        <label>DRENAGEM
          <select name="drainage_class" defaultValue=""><option value="">Não informado</option><option value="well_drained">Bem drenado</option><option value="moderate">Moderadamente drenado</option><option value="poor">Mal drenado</option><option value="unknown">Desconhecido / não avaliado</option></select>
        </label>
        <label>FONTE DA INFORMAÇÃO DO SOLO<input name="soil_data_source" placeholder="Ex.: observação do agricultor, laboratório" /></label>
        <label>DATA DA OBSERVAÇÃO / AMOSTRAGEM<input name="soil_observed_at" type="date" /></label>
      </div>
      <label className="full-label">NOTAS ADICIONAIS<textarea name="notes" rows={3} placeholder="Contexto, método de medição, limitações ou outras observações." /></label>
      <button className="primary-button" type="submit">GUARDAR FAZENDA E DELIMITAÇÃO ↗</button>
    </form>
  );
}
