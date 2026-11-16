import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { safeAuthReturnPath } from "@/lib/auth-redirect";
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string;updated?:string;next?:string}>}){
 const {error,updated,next}=await searchParams;
 const returnPath=safeAuthReturnPath(next);
 return <main className="auth-shell"><Link className="auth-brand" href="/"><img src="/spacexplore-brand.svg" alt="SpaceXplore Tchiowa" /></Link><section className="auth-card"><span className="eyebrow">ACESSO À PLATAFORMA</span><h1>Bem-vindo <em>de volta.</em></h1><p className="auth-copy">Aceda ao seu espaço agrícola e continue a explorar os seus dados.</p>{updated&&<p className="auth-success" role="status">Palavra-passe actualizada com sucesso. Já pode iniciar sessão.</p>}{error&&<p className="auth-error" role="alert">{error}</p>}<form action={signIn} className="auth-form"><input type="hidden" name="next" value={returnPath}/><label>EMAIL<input name="email" type="email" autoComplete="email" required/></label><label>PALAVRA-PASSE<input name="password" type="password" autoComplete="current-password" required/></label><button className="primary-button">INICIAR SESSÃO ↗</button></form><p className="auth-foot"><Link href="/forgot-password">Esqueceu-se da palavra-passe?</Link></p><p className="auth-foot">Ainda não tem conta? <Link href={`/signup?next=${encodeURIComponent(returnPath)}`}>Criar conta</Link></p><Link className="auth-back" href="/">← Voltar à plataforma pública</Link></section></main>;
}
