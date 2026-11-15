"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

type Props = { displayName: string; avatarPath: string | null };

const platformLinks = [
  { href: "/dashboard#nasa-power", label: "NASA POWER", code: "PW" },
  { href: "/dashboard#nasa-gpm", label: "NASA GPM", code: "GP" },
  { href: "/monitoring", label: "Monitorização", code: "MO" },
  { href: "/farms", label: "Explorações", code: "EX" },
  { href: "/crops", label: "Culturas", code: "CU" },
  { href: "/rotation", label: "Rotação", code: "RO" },
  { href: "/insights", label: "Análises", code: "AN" },
];

function Icon({ name }: { name: "menu" | "close" | "settings" | "collapse" }) {
  if (name === "menu") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  if (name === "close") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === "collapse") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" /><path d="m19.4 13.5 1.1.9-1.8 3.1-1.4-.5a7.8 7.8 0 0 1-1.6.9l-.3 1.5h-3.6l-.3-1.5a7.8 7.8 0 0 1-1.6-.9l-1.4.5-1.8-3.1 1.1-.9a7.6 7.6 0 0 1 0-1.9l-1.1-.9 1.8-3.1 1.4.5a7.8 7.8 0 0 1 1.6-.9l.3-1.5h3.6l.3 1.5a7.8 7.8 0 0 1 1.6.9l1.4-.5 1.8 3.1-1.1.9a7.6 7.6 0 0 1 0 1.9Z" /></svg>;
}

export default function DashboardNavigation({ displayName, avatarPath }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState(displayName);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [compact, setCompact] = useState(false);
  const [fieldHints, setFieldHints] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => { document.documentElement.dataset.dashboardDensity = compact ? "compact" : "comfortable"; }, [compact]);

  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    if (!avatarPath) { setAvatar(null); return; }
    setAvatar(supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl);
  }, [avatarPath, supabase]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobileOpen(false); setSettingsOpen(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    let active = true;
    const loadPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
      if (!active) return;
      const preferences = (data?.preferences ?? {}) as { compact_dashboard?: boolean; show_field_hints?: boolean };
      setCompact(Boolean(preferences.compact_dashboard));
      setFieldHints(preferences.show_field_hints !== false);
    };
    void loadPreferences();
    return () => { active = false; };
  }, [supabase]);

  const closeDrawer = () => setMobileOpen(false);
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("A sessão expirou. Inicie sessão novamente.");
      let nextAvatarPath = avatarPath;
      if (file) {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) throw new Error("Utilize uma imagem JPG, PNG ou WebP.");
        if (file.size > 2 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 2 MB.");
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        nextAvatarPath = `${user.id}/avatar.${extension}`;
        const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(nextAvatarPath, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
        if (uploadError) throw uploadError;
      }
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: name.trim(),
        avatar_path: nextAvatarPath,
        preferences: { compact_dashboard: compact, show_field_hints: fieldHints },
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (updateError) throw updateError;
      setAvatar(nextAvatarPath ? `${supabase.storage.from("profile-avatars").getPublicUrl(nextAvatarPath).data.publicUrl}?v=${Date.now()}` : null);
      setFile(null); setMessage("Perfil e preferências guardados.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível guardar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <aside className={`dashboard-sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
        <div className="sidebar-brand-row">
          <Link className="brand dashboard-brand" href="/dashboard" onClick={closeDrawer}>
            <img src="/spacexplore-brand.svg" alt="SpaceXplore Tchiowa" className="workspace-brand-image" />
          </Link>
          <button className="sidebar-collapse-button" type="button" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} onClick={() => setCollapsed(!collapsed)}><Icon name="collapse" /></button>
          <button className="mobile-drawer-close" type="button" aria-label="Fechar menu" onClick={closeDrawer}><Icon name="close" /></button>
        </div>
        <div className="sidebar-caption">ESPAÇO DE TRABALHO</div>
        <nav className="dashboard-nav" aria-label="Navegação principal">
          <span className="nav-group-label">PLATAFORMA / WORKSPACE</span>
          {platformLinks.map((item) => (
            <Link href={item.href} key={item.href} onClick={closeDrawer} aria-current={pathname === item.href.split("#")[0] && item.href !== "/dashboard#nasa-power" && item.href !== "/dashboard#nasa-gpm" ? "page" : undefined}>
              <span className="nav-code">{item.code}</span><span className="nav-link-label">{item.label}</span>
            </Link>
          ))}
          <span className="nav-group-label nav-group-spaced">CONTA & SISTEMA</span>
          <Link href="/dashboard" onClick={closeDrawer} aria-current={pathname === "/dashboard" ? "page" : undefined}><span className="nav-code">OV</span><span className="nav-link-label">Visão geral</span></Link>
          <button className="dashboard-settings-link" type="button" onClick={() => { setSettingsOpen(true); closeDrawer(); }}><span className="nav-code"><Icon name="settings" /></span><span className="nav-link-label">Configurações</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            {avatar ? <img src={avatar} alt="" /> : <span>{displayName.trim().slice(0,1).toUpperCase()}</span>}
            <div><strong>{displayName}</strong><small>Conta pessoal</small></div>
          </div>
          <span className="sidebar-caption">NASA SPACE APPS · 2026</span>
          <form action={signOut}><button className="sidebar-signout"><span className="nav-code">↗</span><span className="nav-link-label">TERMINAR SESSÃO</span></button></form>
        </div>
      </aside>
      {mobileOpen && <button className="dashboard-drawer-backdrop" aria-label="Fechar menu" onClick={closeDrawer} />}
      <header className="dashboard-topline">
        <button className="mobile-menu-trigger" type="button" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? "close" : "menu"} /></button>
        <Link href="/dashboard" className="dashboard-header-brand"><img src="/spacexplore-brand.svg" alt="SpaceXplore Tchiowa" /></Link>
        <span className="account-chip"><i /> CONTA ATIVA</span>
        <button className="dashboard-header-settings" type="button" aria-label="Abrir perfil e configurações" onClick={() => setSettingsOpen(true)}><Icon name="settings" /></button>
      </header>

      {settingsOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <div className="profile-modal-heading"><div><span className="eyebrow">CONTA & SISTEMA</span><h2 id="profile-modal-title">Perfil e preferências</h2></div><button type="button" className="profile-modal-close" aria-label="Fechar" onClick={() => setSettingsOpen(false)}><Icon name="close" /></button></div>
            <form onSubmit={saveProfile} className="profile-settings-form">
              <div className="profile-avatar-editor">
                <div className="profile-avatar-preview">{previewUrl ? <img src={previewUrl} alt="Pré-visualização do avatar" /> : avatar ? <img src={avatar} alt="Avatar atual" /> : <span>{name.trim().slice(0,1).toUpperCase() || "U"}</span>}</div>
                <label className="avatar-upload-button">ALTERAR FOTOGRAFIA<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
                <small>JPG, PNG ou WebP · máximo 2 MB</small>
              </div>
              <label className="profile-field">NOME COMPLETO<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></label>
              <div className="profile-preferences"><span className="eyebrow">PREFERÊNCIAS DA CONTA</span>
                <label><span><strong>Interface compacta</strong><small>Reduz espaços entre cartões no painel.</small></span><input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} /></label>
                <label><span><strong>Ajuda contextual</strong><small>Mostrar explicações junto das ferramentas agrícolas.</small></span><input type="checkbox" checked={fieldHints} onChange={(event) => setFieldHints(event.target.checked)} /></label>
              </div>
              {error && <p className="auth-error" role="alert">{error}</p>}
              {message && <p className="form-message" role="status">{message}</p>}
              <div className="profile-modal-actions"><button type="button" className="profile-cancel" onClick={() => setSettingsOpen(false)}>CANCELAR</button><button className="profile-save" type="submit" disabled={saving}>{saving ? "A GUARDAR…" : "GUARDAR ALTERAÇÕES"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
