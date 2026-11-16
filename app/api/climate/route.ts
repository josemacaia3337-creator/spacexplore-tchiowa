import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PARAMETERS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M"] as const;
const DEFAULT_PARAMETERS = ALLOWED_PARAMETERS.join(",");

function validDate(value: string): boolean {
  if (!/^\d{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sessão para consultar dados NASA POWER." }, { status: 401 });
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
    return NextResponse.json({ error: "Latitude or longitude is outside the valid range." }, { status: 400 });
  }
  if (!validDate(start) || !validDate(end) || start > end) {
    return NextResponse.json({ error: "Use real calendar dates in YYYYMMDD format and ensure start is not after end." }, { status: 400 });
  }
  if (parameters.length === 0 || parameters.length !== requested.length) {
    return NextResponse.json({ error: "One or more requested parameters are not supported." }, { status: 400 });
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
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return NextResponse.json({
        error: `NASA POWER returned HTTP ${response.status}. Check the requested dates and parameters.`
      }, { status: 502 });
    }
    const payload = await response.json();
    return NextResponse.json({
      source: "NASA POWER Daily API",
      sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
      retrievedAt: new Date().toISOString(),
      location: { latitude, longitude },
      requestedPeriod: { start, end },
      timeStandard: "UTC",
      fillValue: payload?.header?.fill_value ?? -999,
      parameters: payload?.parameters ?? {},
      data: payload
    });
  } catch {
    return NextResponse.json({ error: "Could not reach NASA POWER. Please try again." }, { status: 502 });
  }
}
