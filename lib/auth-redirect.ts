const AUTH_RETURN_ORIGIN = "https://spacexplore.internal";
export function safeAuthReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") ||
      value.includes(String.fromCharCode(92)) || Array.from(value).some((character) => character.charCodeAt(0) < 32)) {
    return "/dashboard";
  }
  try {
    const target = new URL(value, AUTH_RETURN_ORIGIN);
    if (target.origin !== AUTH_RETURN_ORIGIN || target.pathname !== "/dashboard") return "/dashboard";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/dashboard";
  }
}
