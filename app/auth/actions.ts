"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=Preencha%20todos%20os%20campos.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=Não%20foi%20possível%20iniciar%20sessão.%20Verifique%20os%20dados.");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2 || !email || password.length < 8) {
    redirect("/signup?error=Informe%20nome,%20email%20válido%20e%20palavra-passe%20com%208%20caracteres.");
  }

  // Use an explicitly configured canonical URL. Request host headers can be
  // rewritten by proxies or preview environments and must not send auth links
  // to localhost or an untrusted host.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    redirect("/signup?error=Configuração%20de%20endereço%20da%20plataforma%20em%20falta.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirect("/signup?error=Não%20foi%20possível%20criar%20a%20conta.%20Verifique%20o%20email%20ou%20tente%20novamente.");
  }
  redirect("/signup/check-email");
}


export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    redirect("/forgot-password?error=Introduza%20um%20endereço%20de%20email%20válido.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\\/$/, "");
  if (!siteUrl) {
    redirect("/forgot-password?error=O%20serviço%20está%20temporariamente%20indisponível.");
  }

  const supabase = await createClient();
  // Deliberately return the same confirmation for existing and unknown accounts.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });
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

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/login?error=O%20link%20de%20recuperação%20é%20inválido%20ou%20expirou.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/reset-password?error=Não%20foi%20possível%20actualizar%20a%20palavra-passe.%20Solicite%20um%20novo%20link.");
  }
  redirect("/login?updated=1");
}


export async function confirmEmail(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  if (!tokenHash || tokenHash.length > 512) {
    redirect("/login?error=Link%20de%20confirmação%20inválido.%20Solicite%20um%20novo.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (error) {
    redirect("/login?error=Este%20link%20já%20foi%20utilizado%20ou%20expirou.%20Tente%20iniciar%20sessão.");
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
