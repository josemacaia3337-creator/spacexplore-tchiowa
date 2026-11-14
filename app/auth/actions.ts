"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function signIn(formData: FormData) {
 const email=String(formData.get("email")??"").trim().toLowerCase(), password=String(formData.get("password")??"");
 if(!email||!password) redirect("/login?error=Preencha%20todos%20os%20campos.");
 const supabase=await createClient(); const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error) redirect("/login?error=Não%20foi%20possível%20iniciar%20sessão.%20Verifique%20os%20dados.");
 redirect("/dashboard");
}
export async function signUp(formData: FormData) {
 const name=String(formData.get("name")??"").trim(), email=String(formData.get("email")??"").trim().toLowerCase(), password=String(formData.get("password")??"");
 if(name.length<2||!email||password.length<8) redirect("/signup?error=Informe%20nome,%20email%20válido%20e%20palavra-passe%20com%208%20caracteres.");
 const supabase=await createClient();
 const {error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://spacexplore-tchiowa.vercel.app"}/auth/callback?next=/dashboard`}});
 if(error) redirect("/signup?error=Não%20foi%20possível%20criar%20a%20conta.%20Verifique%20o%20email%20ou%20tente%20novamente.");
 redirect("/signup/check-email");
}
export async function signOut(){const supabase=await createClient();await supabase.auth.signOut();redirect("/login");}
