import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { logServerError } from "@/lib/server-logger";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const { url, key } = getSupabasePublicConfig();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([name, value]) =>
            response.headers.set(name, value)
          );
        },
      },
    });

    const { error } = await supabase.auth.getClaims();
    if (error) {
      logServerError("SUPABASE_SESSION_REFRESH_FAILED", error, {
        component: "middleware",
      });
    }
  } catch (error) {
    // Public pages remain reachable if Auth is unavailable; protected server pages
    // independently verify the user before returning private data.
    logServerError("SUPABASE_MIDDLEWARE_UNAVAILABLE", error, {
      component: "middleware",
    });
  }

  return response;
}
