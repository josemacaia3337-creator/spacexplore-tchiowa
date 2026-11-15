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
