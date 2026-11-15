"use client";

import { useEffect, useRef, useState } from "react";
import { saveFarmBoundary } from "../actions";

type Position = [number, number];
type PolygonGeometry = { type: "Polygon"; coordinates: number[][][] };

type Props = {
  farmId: string;
  latitude: number | null;
  longitude: number | null;
  initialGeometry: PolygonGeometry | null;
  initialArea: number | null;
  canEdit: boolean;
};

const DEFAULT_CENTER: Position = [-5.55, 12.19];

export default function BoundaryEditor({ farmId, latitude, longitude, initialGeometry, initialArea, canEdit }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [points, setPoints] = useState<Position[]>(() => initialGeometry?.coordinates?.[0]?.slice(0, -1).map(([lng, lat]) => [lat, lng] as Position) ?? []);
  const [drawing, setDrawing] = useState(false);
  const [geometry, setGeometry] = useState<PolygonGeometry | null>(initialGeometry);
  const [area, setArea] = useState<number | null>(initialArea);
  
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | null = null;
    let clickHandler: ((event: import("leaflet").LeafletMouseEvent) => void) | null = null;
    import("leaflet").then((L) => {
      if (disposed || !mapElement.current) return;
      const center = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : DEFAULT_CENTER;
      map = L.map(mapElement.current, { center, zoom: 15, scrollWheelZoom: true });
      const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      const attribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
      L.tileLayer(tileUrl, { maxZoom: 19, attribution }).addTo(map);
      layersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      clickHandler = (event) => {
        if (!drawing) return;
        setPoints((current) => [...current, [event.latlng.lat, event.latlng.lng]]);
        setError("");
      };
      map.on("click", clickHandler);
      window.setTimeout(() => map?.invalidateSize(), 100);
    }).catch(() => setError("Não foi possível carregar o mapa. Verifique a ligação."));
    return () => {
      disposed = true;
      if (map && clickHandler) map.off("click", clickHandler);
      map?.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, [latitude, longitude, drawing]);

  useEffect(() => {
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !layersRef.current) return;
      const layerGroup = layersRef.current;
      layerGroup.clearLayers();
      const latLngs = points.map(([lat, lng]) => L.latLng(lat, lng));
      if (latLngs.length >= 2) {
        L.polyline(latLngs, { color: "#68d8ed", weight: 3, dashArray: "7 6" }).addTo(layerGroup);
      }
      if (latLngs.length >= 3 && geometry) {
        L.polygon(latLngs, { color: "#68d8ed", fillColor: "#2d9ec1", fillOpacity: 0.2, weight: 3 }).addTo(layerGroup);
      }
      if (latLngs.length >= 3 && !drawing) {
        L.polygon(latLngs, { color: "#68d8ed", fillColor: "#2d9ec1", fillOpacity: 0.2, weight: 3 }).addTo(layerGroup);
      }
      latLngs.forEach((latLng, index) => {
        const marker = L.marker(latLng, { draggable: canEdit && !drawing });
        marker.bindTooltip(`Ponto ${index + 1}`);
        marker.on("dragend", () => {
          const next = marker.getLatLng();
          setPoints((current) => {
            const updated = current.map((point, i) => i === index ? [next.lat, next.lng] as Position : point);
            const ring = updated.map(([lat, lng]) => [lng, lat]);
            ring.push([...ring[0]]);
            setGeometry(updated.length >= 3 ? { type: "Polygon", coordinates: [ring] } : null);
            setArea(null);
            return updated;
          });
        });
        marker.addTo(layerGroup);
      });
    });
    return () => { disposed = true; };
  }, [points, geometry, drawing, canEdit]);

  function beginDrawing() {
    setPoints([]);
    setGeometry(null);
    setArea(null);
    setError("");
    setDrawing(true);
  }

  function undoPoint() {
    setPoints((current) => current.slice(0, -1));
    setGeometry(null);
    setArea(null);
  }

  function finishPolygon() {
    if (points.length < 3) {
      setError("Marque pelo menos três pontos para formar um polígono.");
      return;
    }
    const ring = points.map(([lat, lng]) => [lng, lat]);
    ring.push([...ring[0]]);
    setGeometry({ type: "Polygon", coordinates: [ring] });
    setDrawing(false);
    setError("");
  }

  function clearPolygon() {
    setPoints([]);
    setGeometry(null);
    setArea(null);
    setDrawing(false);
    setError("");
  }

  return (
    <div className="boundary-workspace">
      <div className="boundary-help">
        {canEdit
          ? drawing
            ? "Clique no mapa para marcar os vértices do terreno. Use «Desfazer ponto» para corrigir. Termine quando regressar visualmente ao ponto inicial; o sistema fecha o anel automaticamente."
            : "Inicie uma nova delimitação e marque os vértices do terreno no mapa. Pode arrastar os pontos existentes para corrigir a geometria antes de guardar."
          : "Esta delimitação está disponível em modo de consulta. Um proprietário, administrador ou gestor pode editar os limites."}
      </div>
      <div className="boundary-map" ref={mapElement} aria-label="Mapa para delimitação da propriedade agrícola" />
      {canEdit && <div className="boundary-toolbar">
        {!drawing
          ? <button className="primary" type="button" onClick={beginDrawing}>DESENHAR LIMITES</button>
          : <>
              <button type="button" onClick={undoPoint} disabled={!points.length}>DESFAZER PONTO</button>
              <button className="primary" type="button" onClick={finishPolygon} disabled={points.length < 3}>FECHAR POLÍGONO</button>
            </>}
        <button type="button" onClick={clearPolygon} disabled={!points.length && !geometry}>LIMPAR</button>
      </div>}
      <div className="boundary-stats">
        <div className="boundary-stat"><span>VÉRTICES</span><strong>{points.length}</strong></div>
        <div className="boundary-stat"><span>ÁREA GEODÉSICA GUARDADA</span><strong>{area === null ? "—" : `${area.toFixed(4)} ha`}</strong></div>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {canEdit && <form className="boundary-save-form" action={saveFarmBoundary}>
        <input type="hidden" name="farm_id" value={farmId} />
        <input type="hidden" name="boundary_geojson" value={geometry ? JSON.stringify(geometry) : ""} />
        <button className="boundary-save-button" type="submit" disabled={!geometry || drawing}>GUARDAR DELIMITAÇÃO NA EXPLORAÇÃO ↗</button>
      </form>}
      <p className="section-copy">O cálculo final da área é efetuado no servidor com PostGIS sobre a geometria WGS84. A área declarada anteriormente permanece separada; não é substituída automaticamente.</p>
    </div>
  );
}
