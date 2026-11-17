import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getSupabasePublicConfig();
    let authStatus: number | null = null;
    let authReachable = false;

    try {
      const response = await fetch(`${config.url}/auth/v1/settings`, {
        headers: { apikey: config.key, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      authStatus = response.status;
      authReachable = response.ok;
    } catch {
      authReachable = false;
    }

    return NextResponse.json({
      ok: authReachable,
      configuration: "present",
      projectRef: new URL(config.url).hostname.split(".")[0],
      keySource: config.keySource,
      keyFormat: config.key.startsWith("sb_publishable_") ? "publishable" : "legacy-or-other",
      authReachable,
      authHttpStatus: authStatus,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      configuration: "invalid",
      diagnostic: error instanceof Error ? error.message : "Unknown configuration error",
    }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
