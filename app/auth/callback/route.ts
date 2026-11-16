import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAuthReturnPath } from "@/lib/auth-redirect";
import { logServerError } from "@/lib/server-logger";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const safeNext = safeAuthReturnPath(url.searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
      logServerError("AUTH_CALLBACK_EXCHANGE_REJECTED", error, { route: "/auth/callback" });
    } catch (error) {
      logServerError("AUTH_CALLBACK_UNAVAILABLE", error, { route: "/auth/callback" });
    }
  }

  return NextResponse.redirect(new URL(
    "/login?error=Não%20foi%20possível%20confirmar%20o%20email.%20Tente%20novamente.",
    url.origin,
  ));
}
