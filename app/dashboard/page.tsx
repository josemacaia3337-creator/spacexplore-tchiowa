import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrganization } from "@/app/organizations/actions";
import NasaPowerWorkspace from "@/app/dashboard/NasaPowerWorkspace";
import NasaGpmWorkspace from "@/app/dashboard/NasaGpmWorkspace";
import DashboardNavigation from "@/app/dashboard/DashboardNavigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;
  const created = typeof query.created === "string" ? query.created : undefined;
  const returnParams = new URLSearchParams();
  for (const key of ["climate", "latitude", "longitude", "start", "end", "farm", "gpm", "gpmLatitude", "gpmLongitude", "gpmStart", "gpmEnd", "gpmFarm"] as const) {
    const value = query[key];
    if (typeof value === "string") returnParams.set(key, value);
  }
  const returnQuery = returnParams.toString();
  const returnPath = returnQuery ? `/dashboard?${returnQuery}` : "/dashboard";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/signup?next=${encodeURIComponent(returnPath)}`);

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_path, preferences").eq("id", user.id).maybeSingle(),
    supabase.from("memberships")
      .select("organization_id, role, organizations(name,slug)")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const organizationIds = (memberships ?? []).map((membership) => membership.organization_id);
  const { data: farms } = organizationIds.length
    ? await supabase.from("farms").select("id, area_hectares").in("organization_id", organizationIds)
    : { data: [] as { id: string; area_hectares: number | null }[] };

  const name = profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "utilizador";
  const totalArea = (farms ?? []).reduce((sum, farm) => sum + Number(farm.area_hectares ?? 0), 0);
  const metrics = [
    { label: "Organizações", value: String(organizationIds.length), note: "Espaços de trabalho ativos", href: "/dashboard#organizations" },
    { label: "Explorações", value: String(farms?.length ?? 0), note: "Registos na nuvem", href: "/farms" },
    { label: "Área registada", value: totalArea.toLocaleString("pt-PT", { maximumFractionDigits: 2 }), note: "Hectares informados", href: "/farms" },
    { label: "Conta", value: "Ativa", note: "Sessão autenticada", href: "/dashboard#account-settings" },
  ];

  return (
    <main className="dashboard-shell">
      <DashboardNavigation displayName={name} avatarPath={profile?.avatar_path ?? null} />
      <section className="dashboard-main">
        <section className="dashboard-welcome">
          <span className="eyebrow">BEM-VINDO À SPACEXPLORE</span>
          <h1>Olá, <span className="dashboard-greeting-name">{name}</span></h1>
          <p>O seu centro de operações agrícolas. Organize propriedades, acompanhe informação ambiental e explore os seus dados num só lugar.</p>
        </section>

        {created && <p className="form-message" role="status">Organização criada com sucesso.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <section className="dashboard-metrics" aria-label="Indicadores da conta">
          {metrics.map((metric) => (
            <Link className="dashboard-metric dashboard-metric-link" href={metric.href} key={metric.label} aria-label={`${metric.label}: ${metric.value}. ${metric.note}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.note}</small>
            </Link>
          ))}
        </section>

        <NasaPowerWorkspace
          autoRun={query.climate === "1"}
          initialLatitude={typeof query.latitude === "string" ? query.latitude : "-5.55"}
          initialLongitude={typeof query.longitude === "string" ? query.longitude : "12.19"}
          initialStart={typeof query.start === "string" ? query.start : "20250101"}
          initialEnd={typeof query.end === "string" ? query.end : "20251231"}
          farmName={typeof query.farm === "string" ? query.farm : ""}
        />
        <NasaGpmWorkspace
          autoRun={query.gpm === "1"}
          initialLatitude={typeof query.gpmLatitude === "string" ? query.gpmLatitude : "-5.55"}
          initialLongitude={typeof query.gpmLongitude === "string" ? query.gpmLongitude : "12.19"}
          initialStart={typeof query.gpmStart === "string" ? query.gpmStart : new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10)}
          initialEnd={typeof query.gpmEnd === "string" ? query.gpmEnd : new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
          farmName={typeof query.gpmFarm === "string" ? query.gpmFarm : ""}
        />

        <section className="dashboard-section" id="organizations">
          <div className="dashboard-section-heading">
            <div><span className="eyebrow">ESPAÇOS AUTORIZADOS</span><h2>As minhas organizações</h2></div>
          </div>
          {memberships?.length ? (
            <div className="organization-grid">
              {memberships.map((membership) => {
                const organization = (membership.organizations as { name: string; slug: string }[] | null)?.[0];
                return (
                  <article className="organization-card" key={membership.organization_id}>
                    <span className="eyebrow">PAPEL · {membership.role}</span>
                    <h3>{organization?.name ?? "Organização"}</h3>
                    <p>/{organization?.slug ?? ""}</p>
                    <Link href="/farms">ABRIR EXPLORAÇÕES ↗</Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="organization-empty">
              <div className="empty-orbit" aria-hidden="true">S</div>
              <div className="organization-empty-copy">
                <h3>Crie o seu primeiro espaço de trabalho.</h3>
                <p>Uma organização pode representar uma exploração agrícola, empresa, cooperativa ou instituição. Será associado automaticamente como proprietário.</p>
              </div>
              <form action={createOrganization} className="auth-form organization-create-form">
                <label>NOME DA ORGANIZAÇÃO
                  <input name="name" minLength={2} maxLength={120} placeholder="Ex.: Exploração Agrícola Tchiowa" required />
                </label>
                <label>IDENTIFICADOR ÚNICO
                  <input name="slug" pattern="[a-z0-9]+([a-z0-9-]*[a-z0-9])?" maxLength={60} placeholder="ex.: exploracao-tchiowa" required />
                  <small>Use letras minúsculas, números e hífen.</small>
                </label>
                <button className="primary-button">CRIAR ORGANIZAÇÃO ↗</button>
              </form>
            </div>
          )}
        </section>

        <section className="dashboard-section dashboard-insight-section">
          <div className="dashboard-section-heading">
            <div><span className="eyebrow">INTELIGÊNCIA AGRÍCOLA</span><h2>Centro de análise</h2></div>
            <span className="status-tag">EM EVOLUÇÃO</span>
          </div>
          <div className="analytics-placeholder">
            <div className="analytics-placeholder-mark" aria-hidden="true">⌁</div>
            <div><h3>Os seus gráficos começam com os seus dados.</h3><p>As visualizações de clima, satélite e atividade agrícola serão apresentadas aqui à medida que as fontes forem ligadas às suas explorações. Não mostramos indicadores demonstrativos como se fossem dados reais.</p></div>
            <Link href="/insights">EXPLORAR ANÁLISES DISPONÍVEIS ↗</Link>
          </div>
        </section>

        <footer className="dashboard-footer"><span>SPACEXPLORE TCHIOWA</span><span>INTELIGÊNCIA AGRÍCOLA · ANGOLA</span></footer>
      </section>
    </main>
  );
}
