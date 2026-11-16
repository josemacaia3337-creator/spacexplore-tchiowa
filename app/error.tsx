"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SPACEXPLORE_UI_RECOVERY]", {
      event: "ROUTE_RENDER_FAILED",
      digest: error.digest,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <main className="auth-shell">
      <section className="auth-card" role="alert">
        <span className="eyebrow">RECUPERAÇÃO DA INTERFACE</span>
        <h1>Esta área encontrou <em>uma dificuldade.</em></h1>
        <p className="auth-copy">A plataforma continua disponível. Pode tentar carregar esta área novamente ou regressar à página pública.</p>
        <button className="primary-button" onClick={() => reset()}>TENTAR NOVAMENTE ↗</button>
        <a className="auth-back" href="/">Voltar à plataforma pública</a>
      </section>
    </main>
  );
}
