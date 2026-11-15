import Link from "next/link";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const returnPath = next?.startsWith("/dashboard") && !next.startsWith("//") ? next : "/dashboard";
  return (
    <main className="auth-shell">
      <Link className="auth-brand" href="/">◉ SPACEXPLORE <b>TCHIOWA</b></Link>
      <section className="auth-card">
        <span className="eyebrow">EMAIL CONFIRMATION</span>
        <h1>Check your <em>inbox.</em></h1>
        <p className="auth-copy">
          Se esta for uma nova conta, o Supabase enviará uma mensagem de confirmação.
          Abra o email e toque em “Confirm email address”. Na página seguinte, confirme
          novamente no botão para concluir o processo.
        </p>
        <p className="auth-copy">
          Já criou ou confirmou esta conta anteriormente? Não precisa de receber outro link:
          utilize o seu email e palavra-passe para iniciar sessão.
        </p>
        <Link className="primary-button auth-button-link" href={`/login?next=${encodeURIComponent(returnPath)}`}>IR PARA INICIAR SESSÃO</Link>
        <p className="auth-foot">Ainda não tem conta? <Link href="/signup">Criar conta</Link></p>
      </section>
    </main>
  );
}
