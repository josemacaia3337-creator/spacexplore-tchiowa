import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/server-logger";

const ALLOWED_PARAMETERS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M"] as const;
const DEFAULT_PARAMETERS = ALLOWED_PARAMETERS.join(",");

function validDate(value: string): boolean {
  if (!/^\\d{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      logServerError("SUPABASE_AUTH_LOOKUP_FAILED", error, { route: "/api/climate", provider: "supabase-auth" });
      return NextResponse.json({ error: "O serviço de autenticação está temporariamente indisponível. Tente novamente." }, { status: 503 });
    }
    if (!user) {
      return NextResponse.json({ error: "Inicia sessão para consultar dados NASA POWER." }, { status: 401 });
    }
  } catch (error) {
    logServerError("SUPABASE_AUTH_UNAVAILABLE", error, { route: "/api/climate", provider: "supabase-auth" });
    return NextResponse.json({ error: "Não foi possível verificar a sessão neste momento. Tente novamente." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("latitude") ?? "-5.55");
  const longitude = Number(searchParams.get("longitude") ?? "12.19");
  const start = searchParams.get("start") ?? "20250101";
  const end = searchParams.get("end") ?? "20251231";
  const requested = (searchParams.get("parameters") ?? DEFAULT_PARAMETERS).split(",");
  const parameters = requested.filter((item) =>
    ALLOWED_PARAMETERS.includes(item as typeof ALLOWED_PARAMETERS[number])
  );

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Latitude ou longitude fora dos limites válidos." }, { status: 400 });
  }
  if (!validDate(start) || !validDate(end) || start > end) {
    return NextResponse.json({ error: "Use datas reais no formato AAAAMMDD e confirme a ordem do período." }, { status: 400 });
  }
  if (parameters.length === 0 || parameters.length !== requested.length) {
    return NextResponse.json({ error: "Um ou mais parâmetros solicitados não são suportados." }, { status: 400 });
  }

  const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  url.search = new URLSearchParams({
    parameters: parameters.join(","),
    community: "AG",
    longitude: String(longitude),
    latitude: String(latitude),
    start,
    end,
    format: "JSON",
    "time-standard": "UTC"
  }).toString();

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      logServerError("NASA_POWER_UPSTREAM_HTTP_ERROR", new Error("NASA POWER returned a non-success status"), {
        route: "/api/climate", upstreamStatus: response.status,
      });
      return NextResponse.json({
        error: "O serviço NASA POWER não conseguiu concluir a consulta. Verifique o período ou tente novamente mais tarde.",
        diagnostic: "upstream_http_error",
      }, { status: 502 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = await response.json() as Record<string, unknown>;
    } catch (error) {
      logServerError("NASA_POWER_INVALID_UPSTREAM_JSON", error, { route: "/api/climate" });
      return NextResponse.json({ error: "O serviço NASA POWER respondeu num formato inesperado. Tente novamente." }, { status: 502 });
    }

    return NextResponse.json({
      source: "NASA POWER Daily API",
      sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
      retrievedAt: new Date().toISOString(),
      location: { latitude, longitude },
      requestedPeriod: { start, end },
      timeStandard: "UTC",
      fillValue: (payload.header as { fill_value?: number } | undefined)?.fill_value ?? -999,
      parameters: payload.parameters ?? {},
      data: payload
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    logServerError("NASA_POWER_UPSTREAM_FETCH_FAILED", error, { route: "/api/climate", timeoutMs: 20000 });
    return NextResponse.json({
      error: "Não foi possível contactar o serviço NASA POWER ou a consulta excedeu o tempo limite. Tente novamente.",
      diagnostic: "upstream_fetch_failed",
    }, { status: 502 });
  }
}
