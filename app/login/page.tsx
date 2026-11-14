import Link from "next/link";
import { signIn } from "@/app/auth/actions";
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 return <main className="auth-shell"><Link className="auth-brand" href="/">◉ SPACEXPLORE <b>TCHIOWA</b></Link><section className="auth-card"><span className="eyebrow">WORKSPACE ACCESS</span><h1>Welcome <em>back.</em></h1><p className="auth-copy">Aceda ao seu espaço agrícola e continue a explorar os seus dados.</p>{error&&<p className="auth-error" role="alert">{error}</p>}<form action={signIn} className="auth-form"><label>EMAIL<input name="email" type="email" autoComplete="email" required/></label><label>PALAVRA-PASSE<input name="password" type="password" autoComplete="current-password" required/></label><button className="primary-button">INICIAR SESSÃO ↗</button></form><p className="auth-foot">Ainda não tem conta? <Link href="/signup">Criar conta</Link></p><Link className="auth-back" href="/">← Voltar à plataforma pública</Link></section></main>;
}
