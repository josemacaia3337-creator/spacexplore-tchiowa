"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { useLocale, type Locale } from "@/lib/i18n/LocaleProvider";

type Props = { displayName: string; avatarPath: string | null };

const platformLinkDefinitions = [
  { href: "/dashboard#nasa-power", labelKey: "nav.power", code: "PW" },
  { href: "/dashboard#nasa-gpm", labelKey: "nav.gpm", code: "GP" },
  { href: "/monitoring", labelKey: "nav.monitoring", code: "MO" },
  { href: "/farms", labelKey: "nav.farms", code: "EX" },
  { href: "/crops", labelKey: "nav.crops", code: "CU" },
  { href: "/rotation", labelKey: "nav.rotation", code: "RO" },
  { href: "/insights", labelKey: "nav.insights", code: "AN" },
];

function Icon({ name }: { name: "menu" | "close" | "settings" | "collapse" }) {
  if (name === "menu") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  if (name === "close") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === "collapse") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" /><path d="m19.4 13.5 1.1.9-1.8 3.1-1.4-.5a7.8 7.8 0 0 1-1.6.9l-.3 1.5h-3.6l-.3-1.5a7.8 7.8 0 0 1-1.6-.9l-1.4.5-1.8-3.1 1.1-.9a7.6 7.6 0 0 1 0-1.9l-1.1-.9 1.8-3.1 1.4.5a7.8 7.8 0 0 1 1.6-.9l.3-1.5h3.6l.3 1.5a7.8 7.8 0 0 1 1.6.9l1.4-.5 1.8 3.1-1.1.9a7.6 7.6 0 0 1 0 1.9Z" /></svg>;
}

export default function DashboardNavigation({ displayName, avatarPath }: Props) {
  const { locale, setLocale, t } = useLocale();
  const platformLinks = platformLinkDefinitions.map((item) => ({ ...item, label: t(item.labelKey) }));
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
      const preferences = (data?.preferences ?? {}) as { compact_dashboard?: boolean; show_field_hints?: boolean; language?: Locale };
      setCompact(Boolean(preferences.compact_dashboard));
      setFieldHints(preferences.show_field_hints !== false);
      if (preferences.language === "pt" || preferences.language === "en" || preferences.language === "fr" || preferences.language === "es") setLocale(preferences.language);
    };
    void loadPreferences();
    return () => { active = false; };
  }, [supabase, setLocale]);

  const closeDrawer = () => setMobileOpen(false);
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error(t("settings.sessionExpired"));
      let nextAvatarPath = avatarPath;
      if (file) {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) throw new Error(t("settings.imageType"));
        if (file.size > 2 * 1024 * 1024) throw new Error(t("settings.imageSize"));
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        nextAvatarPath = `${user.id}/avatar.${extension}`;
        const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(nextAvatarPath, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
        if (uploadError) throw uploadError;
      }
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: name.trim(),
        avatar_path: nextAvatarPath,
        preferences: { compact_dashboard: compact, show_field_hints: fieldHints, language: locale },
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (updateError) throw updateError;
      setAvatar(nextAvatarPath ? `${supabase.storage.from("profile-avatars").getPublicUrl(nextAvatarPath).data.publicUrl}?v=${Date.now()}` : null);
      setFile(null); setMessage(t("settings.saved"));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("settings.saveError"));
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
        <div className="sidebar-caption">{t("nav.workspace")}</div>
        <nav className="dashboard-nav" aria-label="Navegação principal">
          <span className="nav-group-label">{t("nav.platform")}</span>
          {platformLinks.map((item) => (
            <Link href={item.href} key={item.href} onClick={closeDrawer} aria-current={pathname === item.href.split("#")[0] && item.href !== "/dashboard#nasa-power" && item.href !== "/dashboard#nasa-gpm" ? "page" : undefined}>
              <span className="nav-code">{item.code}</span><span className="nav-link-label">{item.label}</span>
            </Link>
          ))}
          <span className="nav-group-label nav-group-spaced">{t("nav.account")}</span>
          <Link href="/dashboard" onClick={closeDrawer} aria-current={pathname === "/dashboard" ? "page" : undefined}><span className="nav-code">OV</span><span className="nav-link-label">{t("nav.overview")}</span></Link>
          <button className="dashboard-settings-link" type="button" onClick={() => { setSettingsOpen(true); closeDrawer(); }}><span className="nav-code"><Icon name="settings" /></span><span className="nav-link-label">{t("nav.settings")}</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            {avatar ? <img src={avatar} alt="" /> : <span>{displayName.trim().slice(0,1).toUpperCase()}</span>}
            <div><strong>{displayName}</strong><small>{t("nav.personal")}</small></div>
          </div>
          <span className="sidebar-caption">NASA SPACE APPS · 2026</span>
          <form action={signOut}><button className="sidebar-signout"><span className="nav-code">↗</span><span className="nav-link-label">{t("nav.signout")}</span></button></form>
        </div>
      </aside>
      {mobileOpen && <button className="dashboard-drawer-backdrop" aria-label="Fechar menu" onClick={closeDrawer} />}
      <header className="dashboard-topline">
        <button className="mobile-menu-trigger" type="button" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? "close" : "menu"} /></button>
        <Link href="/dashboard" className="dashboard-header-brand"><img src="/spacexplore-brand.svg" alt="SpaceXplore Tchiowa" /></Link>
        <span className="account-chip"><i />{t("nav.active")}</span>
        <button id="account-settings" className="dashboard-header-settings" type="button" aria-label="Abrir perfil e configurações" onClick={() => setSettingsOpen(true)}><Icon name="settings" /></button>
      </header>

      {settingsOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <div className="profile-modal-heading"><div><span className="eyebrow">{t("nav.account")}</span><h2 id="profile-modal-title">Perfil e preferências</h2></div><button type="button" className="profile-modal-close" aria-label="Fechar" onClick={() => setSettingsOpen(false)}><Icon name="close" /></button></div>
            <form onSubmit={saveProfile} className="profile-settings-form">
              <div className="profile-avatar-editor">
                <div className="profile-avatar-preview">{previewUrl ? <img src={previewUrl} alt="Pré-visualização do avatar" /> : avatar ? <img src={avatar} alt="Avatar atual" /> : <span>{name.trim().slice(0,1).toUpperCase() || "U"}</span>}</div>
                <label className="avatar-upload-button">{t("settings.photo")}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
                <small>{t("settings.photoHelp")}</small>
              </div>
              <label className="profile-field">{t("settings.fullName")}<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></label>
              <label className="profile-field">{t("settings.language")}
                <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
                  <option value="pt">Português</option><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option>
                </select>
                <small>{t("settings.languageHelp")}</small>
              </label>
              <div className="profile-preferences"><span className="eyebrow">{t("settings.preferences")}</span>
                <label><span><strong>{t("settings.compact")}</strong><small>{t("settings.compactHelp")}</small></span><input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} /></label>
                <label><span><strong>{t("settings.hints")}</strong><small>{t("settings.hintsHelp")}</small></span><input type="checkbox" checked={fieldHints} onChange={(event) => setFieldHints(event.target.checked)} /></label>
              </div>
              {error && <p className="auth-error" role="alert">{error}</p>}
              {message && <p className="form-message" role="status">{message}</p>}
              <div className="profile-modal-actions"><button type="button" className="profile-cancel" onClick={() => setSettingsOpen(false)}>{t("settings.cancel")}</button><button className="profile-save" type="submit" disabled={saving}>{saving ? t("settings.saving") : t("settings.save")}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
