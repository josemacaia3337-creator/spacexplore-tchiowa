"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SPACEXPLORE_UI_RECOVERY]", {
      event: "ROOT_RENDER_FAILED",
      digest: error.digest,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="pt">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#07111f", color: "#f4f7fb", fontFamily: "Arial, sans-serif", padding: "24px" }}>
        <main style={{ maxWidth: "560px", width: "100%", padding: "36px", border: "1px solid #26384d", borderRadius: "18px", background: "#101d2d" }} role="alert">
          <p style={{ letterSpacing: "0.14em", fontSize: "12px", color: "#91b6d8" }}>SPACEXPLORE TCHIOWA · RECUPERAÇÃO</p>
          <h1 style={{ fontSize: "32px", lineHeight: 1.15 }}>A plataforma está a recuperar.</h1>
          <p style={{ color: "#c2ceda", lineHeight: 1.6 }}>Ocorreu uma dificuldade inesperada. Os dados protegidos continuam resguardados. Tente novamente ou regresse à página pública.</p>
          <button onClick={() => reset()} style={{ padding: "13px 18px", border: 0, borderRadius: "8px", background: "#b9d8f2", color: "#102238", fontWeight: 700, cursor: "pointer" }}>TENTAR NOVAMENTE</button>
          <p><a href="/" style={{ color: "#b9d8f2" }}>Voltar à plataforma pública</a></p>
        </main>
      </body>
    </html>
  );
}
