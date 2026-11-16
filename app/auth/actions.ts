"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeAuthReturnPath } from "@/lib/auth-redirect";
import { logServerError } from "@/lib/server-logger";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function safeCreateAuthClient(event: string): Promise<SupabaseServerClient | null> {
  try {
    return await createClient();
  } catch (error) {
    logServerError(event, error, { area: "supabase-auth" });
    return null;
  }
}

async function safeAuthOperation<T>(event: string, operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    logServerError(event, error, { area: "supabase-auth" });
    return null;
  }
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeAuthReturnPath(formData.get("next"));
  if (!email || !password) redirect(`/login?error=Preencha%20todos%20os%20campos.&next=${encodeURIComponent(next)}`);

  const supabase = await safeCreateAuthClient("AUTH_SIGN_IN_CLIENT_UNAVAILABLE");
  if (!supabase) redirect(`/login?error=O%20serviço%20de%20autenticação%20está%20temporariamente%20indisponível.&next=${encodeURIComponent(next)}`);
  const result = await safeAuthOperation("AUTH_SIGN_IN_FAILED", () => supabase.auth.signInWithPassword({ email, password }));
  if (!result) redirect(`/login?error=Não%20foi%20possível%20contactar%20o%20serviço%20de%20autenticação.&next=${encodeURIComponent(next)}`);
  if (result.error) {
    logServerError("AUTH_SIGN_IN_REJECTED", result.error, { area: "supabase-auth" });
    redirect(`/login?error=Não%20foi%20possível%20iniciar%20sessão.%20Verifique%20os%20dados.&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeAuthReturnPath(formData.get("next"));

  if (name.length < 2 || !email || password.length < 8) {
    redirect(`/signup?error=Informe%20nome,%20email%20válido%20e%20palavra-passe%20com%208%20caracteres.&next=${encodeURIComponent(next)}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    logServerError("AUTH_SITE_URL_MISSING", new Error("NEXT_PUBLIC_SITE_URL is not configured"), { action: "sign-up" });
    redirect(`/signup?error=Configuração%20de%20endereço%20da%20plataforma%20em%20falta.&next=${encodeURIComponent(next)}`);
  }

  const supabase = await safeCreateAuthClient("AUTH_SIGN_UP_CLIENT_UNAVAILABLE");
  if (!supabase) redirect(`/signup?error=O%20serviço%20está%20temporariamente%20indisponível.&next=${encodeURIComponent(next)}`);
  const result = await safeAuthOperation("AUTH_SIGN_UP_FAILED", () => supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  }));

  if (!result) redirect(`/signup?error=Não%20foi%20possível%20contactar%20o%20serviço.%20Tente%20novamente.&next=${encodeURIComponent(next)}`);
  if (result.error) {
    logServerError("AUTH_SIGN_UP_REJECTED", result.error, { action: "sign-up" });
    redirect(`/signup?error=Não%20foi%20possível%20criar%20a%20conta.%20Verifique%20o%20email%20ou%20tente%20novamente.&next=${encodeURIComponent(next)}`);
  }
  redirect(`/signup/check-email?next=${encodeURIComponent(next)}`);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const emailParts = email.split("@");
  if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]?.includes(".") || emailParts[1].startsWith(".") || emailParts[1].endsWith(".")) {
    redirect("/forgot-password?error=Introduza%20um%20endereço%20de%20email%20válido.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    logServerError("AUTH_SITE_URL_MISSING", new Error("NEXT_PUBLIC_SITE_URL is not configured"), { action: "password-reset" });
    redirect("/forgot-password?error=O%20serviço%20está%20temporariamente%20indisponível.");
  }

  const supabase = await safeCreateAuthClient("AUTH_PASSWORD_RESET_CLIENT_UNAVAILABLE");
  if (!supabase) redirect("/forgot-password?error=O%20serviço%20está%20temporariamente%20indisponível.");
  const result = await safeAuthOperation("AUTH_PASSWORD_RESET_FAILED", () => supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  }));
  if (!result || result.error) {
    if (result?.error) logServerError("AUTH_PASSWORD_RESET_REJECTED", result.error, { action: "password-reset" });
    redirect("/forgot-password?error=Não%20foi%20possível%20contactar%20o%20serviço.%20Tente%20novamente.");
  }
  // Same confirmation for existing and unknown accounts to avoid account enumeration.
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8 || password.length > 128) {
    redirect("/reset-password?error=A%20palavra-passe%20deve%20ter%20entre%208%20e%20128%20caracteres.");
  }
  if (password !== confirmation) {
    redirect("/reset-password?error=As%20palavras-passe%20não%20coincidem.");
  }

  const supabase = await safeCreateAuthClient("AUTH_PASSWORD_UPDATE_CLIENT_UNAVAILABLE");
  if (!supabase) redirect("/login?error=O%20serviço%20de%20autenticação%20está%20temporariamente%20indisponível.");
  const userResult = await safeAuthOperation("AUTH_PASSWORD_UPDATE_USER_LOOKUP_FAILED", () => supabase.auth.getUser());
  if (!userResult || userResult.error || !userResult.data.user) {
    if (userResult?.error) logServerError("AUTH_PASSWORD_UPDATE_USER_LOOKUP_REJECTED", userResult.error, { action: "password-update" });
    redirect("/login?error=O%20link%20de%20recuperação%20é%20inválido%20ou%20expirou.");
  }

  const result = await safeAuthOperation("AUTH_PASSWORD_UPDATE_FAILED", () => supabase.auth.updateUser({ password }));
  if (!result || result.error) {
    if (result?.error) logServerError("AUTH_PASSWORD_UPDATE_REJECTED", result.error, { action: "password-update" });
    redirect("/reset-password?error=Não%20foi%20possível%20actualizar%20a%20palavra-passe.%20Solicite%20um%20novo%20link.");
  }
  redirect("/login?updated=1");
}

export async function confirmEmail(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  if (!tokenHash || tokenHash.length > 512) {
    redirect("/login?error=Link%20de%20confirmação%20inválido.%20Solicite%20um%20novo.");
  }

  const supabase = await safeCreateAuthClient("AUTH_EMAIL_CONFIRM_CLIENT_UNAVAILABLE");
  if (!supabase) redirect("/login?error=O%20serviço%20está%20temporariamente%20indisponível.");
  const result = await safeAuthOperation("AUTH_EMAIL_CONFIRM_FAILED", () => supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  }));

  if (!result || result.error) {
    if (result?.error) logServerError("AUTH_EMAIL_CONFIRM_REJECTED", result.error, { action: "email-confirmation" });
    redirect("/login?error=Este%20link%20já%20foi%20utilizado%20ou%20expirou.%20Tente%20iniciar%20sessão.");
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await safeCreateAuthClient("AUTH_SIGN_OUT_CLIENT_UNAVAILABLE");
  if (supabase) {
    const result = await safeAuthOperation("AUTH_SIGN_OUT_FAILED", () => supabase.auth.signOut());
    if (result?.error) logServerError("AUTH_SIGN_OUT_REJECTED", result.error, { action: "sign-out" });
  }
  redirect("/login");
}
