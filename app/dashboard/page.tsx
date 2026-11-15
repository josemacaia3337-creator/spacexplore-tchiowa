import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { createOrganization } from "@/app/organizations/actions";

const navigation = [
  { href: "/", label: "Explorador climático", code: "01" },
  { href: "/farms", label: "Explorações", code: "02" },
  { href: "/crops", label: "Culturas", code: "03" },
  { href: "/rotation", label: "Rotação", code: "04" },
  { href: "/insights", label: "Análises", code: "05" },
  { href: "/monitoring", label: "Monitorização", code: "06" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
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
    { label: "Organizações", value: String(organizationIds.length), note: "Espaços de trabalho ativos" },
    { label: "Explorações", value: String(farms?.length ?? 0), note: "Registos na nuvem" },
    { label: "Área registada", value: totalArea.toLocaleString("pt-PT", { maximumFractionDigits: 2 }), note: "Hectares informados" },
    { label: "Conta", value: "Ativa", note: "Sessão autenticada" },
  ];

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="brand dashboard-brand" href="/">
          <span className="brand-mark">S</span>
          <span>SPACEXPLORE <b>TCHIOWA</b></span>
        </Link>
        <div className="sidebar-caption">ESPAÇO DE TRABALHO</div>
        <nav className="dashboard-nav" aria-label="Navegação principal">
          <span className="nav-group-label">PLATAFORMA</span>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              <span className="nav-code">{item.code}</span>{item.label}
            </Link>
          ))}
          <span className="nav-group-label nav-group-spaced">CONTA</span>
          <Link href="/dashboard" aria-current="page"><span className="nav-code">06</span>Visão geral</Link>
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-caption">NASA SPACE APPS · 2026</span>
          <form action={signOut}><button className="sidebar-signout">TERMINAR SESSÃO ↗</button></form>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topline">
          <span>ESPAÇO PESSOAL <span className="breadcrumb-separator">/</span> VISÃO GERAL</span>
          <span className="account-chip"><i /> CONTA ATIVA</span>
        </header>

        <section className="dashboard-welcome">
          <span className="eyebrow">BEM-VINDO À SPACEXPLORE</span>
          <h1>Olá, <em>{name}</em></h1>
          <p>O seu centro de operações agrícolas. Organize propriedades, acompanhe informação ambiental e explore os seus dados num só lugar.</p>
        </section>

        {created && <p className="form-message" role="status">Organização criada com sucesso.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <section className="dashboard-metrics" aria-label="Indicadores da conta">
          {metrics.map((metric) => (
            <article className="dashboard-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.note}</small>
            </article>
          ))}
        </section>

        <section className="dashboard-section">
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
