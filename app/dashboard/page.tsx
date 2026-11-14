import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { createOrganization } from "@/app/organizations/actions";

export default async function DashboardPage({searchParams}:{searchParams:Promise<{error?:string;created?:string}>}){
 const {error,created}=await searchParams;
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:profile},{data:memberships}]=await Promise.all([
  supabase.from("profiles").select("display_name").eq("id",user.id).maybeSingle(),
  supabase.from("memberships").select("organization_id,role,organizations(name,slug)").eq("user_id",user.id).eq("status","active")
 ]);
 const name=profile?.display_name||user.user_metadata?.display_name||user.email?.split("@")[0]||"utilizador";
 return <main className="shell"><header className="topbar"><Link className="brand" href="/"><span className="brand-mark">S</span><span>SPACEXPLORE <b>TCHIOWA</b></span></Link><form action={signOut}><button className="text-button">TERMINAR SESSÃO ↗</button></form></header>
 <section className="farm-hero"><span className="eyebrow">PERSONAL WORKSPACE</span><h1>Welcome,<br/><em>{name}.</em></h1><p className="hero-copy">O seu espaço de trabalho agrícola, com dados e propriedades organizados num só lugar.</p></section>
 <section className="workspace"><div className="section-heading"><div><span className="eyebrow">YOUR ORGANIZATIONS</span><h2>Organizações</h2></div><span className="status-tag">ACCOUNT ACTIVE</span></div>
 {created&&<p className="form-message" role="status">Organização criada com sucesso.</p>}{error&&<p className="auth-error" role="alert">{error}</p>}
 {memberships?.length?<div className="farm-cards">{memberships.map(m=><article className="farm-card" key={m.organization_id}><span className="eyebrow">{m.role}</span><h3>{(m.organizations as {name:string;slug:string}[]|null)?.[0]?.name??"Organização"}</h3><p className="farm-location">/{(m.organizations as {name:string;slug:string}[]|null)?.[0]?.slug??""}</p><Link className="farm-climate-link" href="/farms">GERIR PROPRIEDADES ↗</Link></article>)}</div>:<div className="empty-state"><strong>Comece por criar a sua organização.</strong><p>Uma organização representa o seu espaço de trabalho, empresa, cooperativa ou exploração agrícola. Será automaticamente associado como proprietário.</p>
 <form action={createOrganization} className="auth-form org-form"><label>NOME DA ORGANIZAÇÃO<input name="name" minLength={2} maxLength={120} placeholder="Ex.: Exploração Agrícola Tchiowa" required/></label><label>IDENTIFICADOR ÚNICO<input name="slug" pattern="[a-z0-9]+([a-z0-9-]*[a-z0-9])?" maxLength={60} placeholder="ex.: exploracao-tchiowa" required/><small>Use letras minúsculas, números e hífen. Não poderá conter espaços.</small></label><button className="primary-button">CRIAR ORGANIZAÇÃO ↗</button></form></div>}
 <div className="notice">Apenas membros autorizados poderão consultar os dados de cada organização e das respetivas propriedades.</div></section></main>;
}
