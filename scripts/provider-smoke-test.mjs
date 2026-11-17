const timeoutMs = 20000;
const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
url.search = new URLSearchParams({
  parameters: "T2M,PRECTOTCORR",
  community: "AG",
  longitude: "12.19",
  latitude: "-5.55",
  start: "20250101",
  end: "20250103",
  format: "JSON",
  "time-standard": "UTC",
}).toString();

try {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const contentType = response.headers.get("content-type") ?? "unknown";
  const body = await response.text();
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(`Expected JSON but received ${contentType}: ${body.slice(0, 180).replace(/\\s+/g, " ")}`);
  }
  const parameters = payload?.properties?.parameter;
  if (!parameters || typeof parameters !== "object" || !("T2M" in parameters)) {
    throw new Error("NASA POWER payload is missing the expected T2M parameter.");
  }
  console.log(JSON.stringify({
    event: "PROVIDER_SMOKE_TEST_PASSED",
    provider: "NASA_POWER_DAILY",
    status: response.status,
    checkedAt: new Date().toISOString(),
  }));
} catch (error) {
  console.error(JSON.stringify({
    event: "PROVIDER_SMOKE_TEST_FAILED",
    provider: "NASA_POWER_DAILY",
    checkedAt: new Date().toISOString(),
    error: error instanceof Error
      ? { name: error.name, message: error.message.slice(0, 500) }
      : { message: String(error).slice(0, 500) },
  }));
  process.exitCode = 1;
}
