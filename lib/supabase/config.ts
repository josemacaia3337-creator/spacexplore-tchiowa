export type SupabasePublicConfig = { url: string; key: string; keySource: "publishable" | "legacy-anon" };

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const legacyAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const key = publishableKey || legacyAnonKey;
  const keySource = publishableKey ? "publishable" : "legacy-anon";

  if (!rawUrl || !key) {
    throw new Error(
      `Supabase configuration incomplete (urlPresent=${Boolean(rawUrl)}, publishableKeyPresent=${Boolean(publishableKey)}, legacyAnonKeyPresent=${Boolean(legacyAnonKey)}).`
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid absolute URL.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use HTTPS.");
  }

  if (key.startsWith("sb_secret_") || key.startsWith("service_role")) {
    throw new Error("A secret/service-role key cannot be used by the public Supabase client.");
  }

  return {
    url: parsedUrl.origin,
    key,
    keySource,
  };
}
