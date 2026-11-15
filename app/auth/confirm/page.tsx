import Link from "next/link";
import { confirmEmail } from "@/app/auth/actions";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash, type } = await searchParams;
  const validLink = Boolean(token_hash && type === "email");

  return (
    <main className="auth-shell">
      <Link className="auth-brand" href="/">◉ SPACEXPLORE <b>TCHIOWA</b></Link>
      <section className="auth-card">
        <span className="eyebrow">EMAIL CONFIRMATION</span>
        <h1>Confirm your <em>email.</em></h1>
        {validLink ? (
          <>
            <p className="auth-copy">
              O endereço foi aberto. Para concluir a confirmação, toque no botão abaixo.
            </p>
            <form action={confirmEmail} className="auth-form">
              <input type="hidden" name="token_hash" value={token_hash} />
              <button className="primary-button">CONFIRMAR ENDEREÇO ↗</button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-copy">
              Este link não contém um código de confirmação válido. Se a sua conta já foi confirmada, entre diretamente.
            </p>
            <Link className="primary-button auth-button-link" href="/login">IR PARA INICIAR SESSÃO</Link>
          </>
        )}
      </section>
    </main>
  );
}
