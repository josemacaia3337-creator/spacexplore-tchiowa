import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { safeAuthReturnPath } from "@/lib/auth-redirect";
export default async function SignupPage({searchParams}:{searchParams:Promise<{error?:string;next?:string}>}){
 const {error,next}=await searchParams;
 const returnPath=safeAuthReturnPath(next);
 return <main className="auth-shell"><Link className="auth-brand" href="/"><img src="/spacexplore-brand.svg" alt="SpaceXplore Tchiowa" /></Link><section className="auth-card"><span className="eyebrow">CRIAR A SUA CONTA</span><h1>Cresça com <em>conhecimento.</em></h1><p className="auth-copy">Crie a sua conta para começar a organizar propriedades e informação agrícola.</p>{error&&<p className="auth-error" role="alert">{error}</p>}<form action={signUp} className="auth-form"><input type="hidden" name="next" value={returnPath}/><label>NOME COMPLETO<input name="name" autoComplete="name" minLength={2} required/></label><label>EMAIL<input name="email" type="email" autoComplete="email" required/></label><label>PALAVRA-PASSE<input name="password" type="password" autoComplete="new-password" minLength={8} required/><small>Mínimo de 8 caracteres.</small></label><button className="primary-button">CRIAR CONTA ↗</button></form><p className="auth-foot">Já tem conta? <Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Iniciar sessão</Link></p><Link className="auth-back" href="/">← Voltar à plataforma pública</Link></section></main>;
}
