import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="auth-shell"><Link className="auth-brand" href="/">◉ SPACEXPLORE <b>TCHIOWA</b></Link><section className="auth-card"><span className="eyebrow">SECURE YOUR ACCOUNT</span><h1>New <em>password.</em></h1><p className="auth-copy">Defina uma nova palavra-passe para voltar a aceder ao seu espaço agrícola.</p>{error && <p className="auth-error" role="alert">{error}</p>}<form action={updatePassword} className="auth-form"><label>NOVA PALAVRA-PASSE<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /><small>Utilize entre 8 e 128 caracteres.</small></label><label>CONFIRMAR PALAVRA-PASSE<input name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><button className="primary-button">ACTUALIZAR PALAVRA-PASSE ↗</button></form><p className="auth-foot">Problemas com o link? <Link href="/forgot-password">Solicitar outro</Link></p><Link className="auth-back" href="/">← Voltar à plataforma pública</Link></section></main>;
}
