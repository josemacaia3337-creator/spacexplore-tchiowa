import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { logServerError } from "@/lib/server-logger";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    logServerError("SUPABASE_MIDDLEWARE_CONFIGURATION_MISSING", new Error("Supabase public environment variables are missing"), {
      route: request.nextUrl.pathname,
    });
    return response;
  }

  try {
    const supabase = createServerClient(url, key, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    }});

    const { error } = await supabase.auth.getClaims();
    if (error) {
      logServerError("SUPABASE_SESSION_REFRESH_FAILED", error, { route: request.nextUrl.pathname });
    }
  } catch (error) {
    logServerError("SUPABASE_MIDDLEWARE_UNAVAILABLE", error, { route: request.nextUrl.pathname });
  }

  // Middleware is deliberately non-blocking for public routes. Protected pages
  // still verify the user server-side and fail closed if identity cannot be checked.
  return response;
}
