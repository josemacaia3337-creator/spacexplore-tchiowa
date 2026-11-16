import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return <main className="auth-shell"><Link className="auth-brand" href="/">◉ SPACEXPLORE <b>TCHIOWA</b></Link><section className="auth-card"><span className="eyebrow">RECUPERAÇÃO DE CONTA</span><h1>Recupere o <em>acesso.</em></h1><p className="auth-copy">Indique o email associado à sua conta. Se existir uma conta correspondente, enviaremos instruções para definir uma nova palavra-passe.</p>{error && <p className="auth-error" role="alert">{error}</p>}{sent && <p className="auth-success" role="status">Se o endereço estiver registado, receberá um email com um link de recuperação. Verifique também a pasta de spam.</p>}<form action={requestPasswordReset} className="auth-form"><label>EMAIL<input name="email" type="email" autoComplete="email" required /></label><button className="primary-button">ENVIAR LINK DE RECUPERAÇÃO ↗</button></form><p className="auth-foot">Já se lembra da palavra-passe? <Link href="/login">Iniciar sessão</Link></p><Link className="auth-back" href="/">← Voltar à plataforma pública</Link></section></main>;
}
