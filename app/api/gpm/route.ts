import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PMM_ENDPOINT = "https://pmmpublisher.pps.eosdis.nasa.gov/opensearch";
const MAX_WINDOW_DAYS = 60;

type PmmValue = string | number | { "@value"?: string | number; value?: string | number } | undefined;
type PmmItem = {
  "@id"?: string;
  displayName?: string;
  image?: Array<{ url?: string; mediaType?: string; rel?: string }>;
  properties?: Record<string, PmmValue>;
};
type PmmResponse = { totalItems?: number; items?: PmmItem[] };

function validDate(value: string): boolean {
  if (value.length !== 10 || value[4] !== "-" || value[7] !== "-") return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function propertyValue(value: PmmValue): string {
  if (value && typeof value === "object") return String(value["@value"] ?? value.value ?? "");
  return value === undefined ? "" : String(value);
}
function safePreviewUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "pmmpublisher.pps.eosdis.nasa.gov") return null;
    return url.toString();
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sessão para consultar dados NASA GPM." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const latitudeRaw = params.get("latitude") ?? "";
  const longitudeRaw = params.get("longitude") ?? "";
  if (!latitudeRaw.trim() || !longitudeRaw.trim()) {
    return NextResponse.json({ error: "Latitude e longitude são obrigatórias." }, { status: 400 });
  }
  const latitude = Number(latitudeRaw);
  const longitude = Number(longitudeRaw);
  const start = params.get("start") ?? "";
  const end = params.get("end") ?? "";

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Indique coordenadas geográficas válidas." }, { status: 400 });
  }
  if (!validDate(start) || !validDate(end) || start > end) {
    return NextResponse.json({ error: "Indique datas válidas no formato AAAA-MM-DD e confirme a ordem do período." }, { status: 400 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const first = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  const oldest = new Date(today);
  oldest.setUTCDate(oldest.getUTCDate() - (MAX_WINDOW_DAYS - 1));
  const days = Math.floor((last.getTime() - first.getTime()) / 86400000) + 1;
  if (first < oldest || last > today || days > MAX_WINDOW_DAYS) {
    return NextResponse.json({
      error: "O NASA GPM PMM Publisher disponibiliza esta coleção numa janela móvel dos últimos 60 dias. Selecione um período dentro dessa janela e sem datas futuras."
    }, { status: 400 });
  }

  const upstreamUrl = new URL(PMM_ENDPOINT);
  upstreamUrl.search = new URLSearchParams({
    q: "precip_1d",
    lat: String(latitude),
    lon: String(longitude),
    limit: String(MAX_WINDOW_DAYS),
    startTime: start,
    endTime: end,
  }).toString();

  let response: Response;
  try {
    response = await fetch(upstreamUrl, {
      headers: { Accept: "application/activity+json, application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    const detail = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
    console.error("[NASA_GPM_UPSTREAM_FETCH_FAILED]", { endpoint: PMM_ENDPOINT, detail });
    return NextResponse.json({
      error: "A ligação ao serviço NASA GPM falhou ou excedeu o tempo limite. Tente novamente.",
      diagnostic: "upstream_fetch_failed",
    }, { status: 502 });
  }

  if (!response.ok) {
    console.error("[NASA_GPM_UPSTREAM_HTTP_ERROR]", { status: response.status, statusText: response.statusText });
    return NextResponse.json({ error: `NASA GPM Publisher devolveu HTTP ${response.status}.` }, { status: 502 });
  }

  let payload: PmmResponse;
  try {
    payload = await response.json() as PmmResponse;
  } catch (error) {
    const detail = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
    console.error("[NASA_GPM_INVALID_UPSTREAM_JSON]", { contentType: response.headers.get("content-type"), detail });
    return NextResponse.json({
      error: "O serviço NASA GPM respondeu num formato inesperado. Tente novamente mais tarde.",
      diagnostic: "invalid_upstream_response",
    }, { status: 502 });
  }

  try {
    const items = (Array.isArray(payload.items) ? payload.items : []).map((item) => {
      const rawDate = propertyValue(item.properties?.date);
      const isoDate = /^[0-9]{8}$/.test(rawDate)
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate;
      const preview = item.image?.find((image) => image.rel === "browse" || image.mediaType === "image/png")?.url;
      return {
        id: item["@id"] ?? item.displayName ?? isoDate,
        displayName: item.displayName ?? item["@id"] ?? "IMERG daily accumulation",
        date: isoDate,
        previewUrl: safePreviewUrl(preview),
        source: propertyValue(item.properties?.source) || "NASA GSFC GPM",
        resolution: propertyValue(item.properties?.resolution) || "0.1deg",
      };
    }).filter((item) => validDate(item.date))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      source: "NASA GPM / PMM Publisher API",
      sourceUrl: "https://gpm.nasa.gov/precip-apps/doc",
      product: "precip_1d",
      productName: "IMERG Late Run — 1-day precipitation accumulation",
      unit: "mm",
      temporalResolution: "1 day",
      spatialResolution: "0.1° (approximately 10 km)",
      availabilityWindowDays: MAX_WINDOW_DAYS,
      totalItems: Number(payload.totalItems ?? items.length),
      retrievedAt: new Date().toISOString(),
      location: { latitude, longitude },
      requestedPeriod: { start, end },
      items,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const detail = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
    console.error("[NASA_GPM_RESPONSE_PROCESSING_FAILED]", detail);
    return NextResponse.json({ error: "Não foi possível processar a resposta do serviço NASA GPM." }, { status: 502 });
  }
}
